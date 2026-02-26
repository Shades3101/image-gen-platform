import modal
import os
from pathlib import Path
from dataclasses import dataclass

# ─────────────────────────────────────────────────────────────────
# App & Volume
# ─────────────────────────────────────────────────────────────────

app = modal.App("pixgen-gpu")

volume = modal.Volume.from_name("pixgen_models", create_if_missing=True)
MODEL_DIR = "/models"

# Base model for Flux LoRA training
BASE_MODEL = "black-forest-labs/FLUX.1-dev"
DIFFUSERS_REPO = "https://github.com/huggingface/diffusers.git"
DIFFUSERS_REF = "v0.31.0"  # pinned for reproducibility

# ─────────────────────────────────────────────────────────────────
# Container Image — all ML deps baked in at build time
# ─────────────────────────────────────────────────────────────────

gpu_image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install("git")
    .uv_pip_install(
        "accelerate==0.31.0",
        "datasets~=2.13.0",
        "fastapi[standard]==0.115.4",
        "ftfy~=6.1.0",
        "huggingface-hub==0.31.0",
        "numpy<2",
        "peft==0.15.2",
        "pydantic==2.9.2",
        "sentencepiece>=0.1.91,!=0.1.92",
        "smart_open~=6.4.0",
        "starlette==0.41.2",
        "transformers~=4.41.2",
        "torch~=2.2.0",
        "torchvision~=0.16",
        "triton~=2.2.0",
        "wandb==0.17.6",
        "diffusers>=0.25.0",
        "boto3>=1.34.0",
        "requests>=2.31.0",
        "safetensors>=0.4.0",
        "Pillow>=10.0.0",
        "prodigyopt",            # Prodigy optimizer for better LoRA convergence
        "bitsandbytes>=0.43.0",  # 8-bit Adam optimizer for memory savings
    )
    .env({"HF_HOME": "/cache/huggingface"})
    # Clone diffusers repo and install training script requirements
    .run_commands(
        f"git clone --depth 1 --branch {DIFFUSERS_REF} {DIFFUSERS_REPO} /diffusers",
        "pip install -r /diffusers/examples/dreambooth/requirements_flux.txt || true",
    )
)


# ─────────────────────────────────────────────────────────────────
# Training configuration — tuned for face/person LoRA  
# ─────────────────────────────────────────────────────────────────

@dataclass
class TrainConfig:
    """Hyperparameters for Flux LoRA DreamBooth training on faces.
    
    Budget-optimized for $5 total:
      - L4 GPU (~$0.80/hr) + 500 steps ≈ $0.08–$0.12 per training run
      - ~30–50 training runs possible within $5
    """
    max_train_steps: int = 500           # ~8 min on L4, enough for 10-20 face images
    learning_rate: float = 1e-4          # standard for LoRA
    lora_rank: int = 8                   # smaller rank = faster + less VRAM for L4
    resolution: int = 512                # 512 to fit in L4's 24GB VRAM
    train_batch_size: int = 1            # keep at 1 to fit in 24GB L4
    gradient_accumulation_steps: int = 2 # effective batch size of 2
    lr_scheduler: str = "constant"       # constant works well for short LoRA runs
    seed: int = 42
    mixed_precision: str = "fp16"        # FP16 for L4/T4 (bf16 needs A100+)
    gradient_checkpointing: bool = True  # save VRAM at slight speed cost


# ─────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────

def _sign_payload(payload: dict) -> str:
    """Create HMAC-SHA256 signature for webhook payload.
    
    IMPORTANT: The Express backend verifies with:
        crypto.createHmac("sha256", secret).update(JSON.stringify(req.body)).digest("hex")
    
    JS JSON.stringify produces: {"key": "value"} (space after colon)
    Python json.dumps default also produces: {"key": "value"} (space after colon)
    
    So we use default separators to ensure signatures match.
    """
    import json, hmac, hashlib
    secret = os.environ["MODAL_WEBHOOK_SECRET"]
    body = json.dumps(payload, separators=(", ", ": "))
    return hmac.new(secret.encode(), body.encode(), hashlib.sha256).hexdigest()


def _send_webhook(webhook_url: str, payload: dict):
    """Send signed webhook to Express backend."""
    import requests
    signature = _sign_payload(payload)
    try:
        requests.post(
            webhook_url,
            json=payload,
            headers={"X-Modal-Signature": signature},
            timeout=15,
        )
    except Exception as e:
        print(f"[WEBHOOK ERROR] Failed to send webhook: {e}")


def _upload_to_s3(image_bytes: bytes, s3_key: str, content_type: str = "image/png") -> str:
    """Upload bytes to S3/R2 and return the public URL."""
    import boto3
    s3 = boto3.client(
        "s3",
        endpoint_url=os.environ["S3_ENDPOINT"],
        aws_access_key_id=os.environ["S3_ACCESS_KEY"],
        aws_secret_access_key=os.environ["S3_SECRET_KEY"],
    )
    bucket = os.environ["S3_BUCKET_NAME"]
    s3.put_object(
        Bucket=bucket,
        Key=s3_key,
        Body=image_bytes,
        ContentType=content_type,
    )
    return f"{os.environ['S3_ENDPOINT']}/{bucket}/{s3_key}"


def _pil_to_bytes(image) -> bytes:
    """Convert a PIL Image to PNG bytes."""
    import io
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return buf.getvalue()


def _prepare_training_images(zip_url: str, output_dir: str) -> str:
    """Download and extract training images from a ZIP URL.
    
    Returns the directory containing the extracted images.
    """
    import requests, zipfile, io
    from pathlib import Path
    
    img_dir = Path(output_dir)
    img_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"[TRAIN] Downloading training images from {zip_url}")
    resp = requests.get(zip_url, timeout=120)
    resp.raise_for_status()
    
    with zipfile.ZipFile(io.BytesIO(resp.content)) as z:
        z.extractall(str(img_dir))
    
    # Flatten: if the zip had a single subdirectory, use that instead
    subdirs = [d for d in img_dir.iterdir() if d.is_dir()]
    if len(subdirs) == 1 and not any(img_dir.glob("*.jpg")) and not any(img_dir.glob("*.png")):
        img_dir = subdirs[0]
    
    # Count images
    image_files = list(img_dir.glob("*.jpg")) + list(img_dir.glob("*.jpeg")) + \
                  list(img_dir.glob("*.png")) + list(img_dir.glob("*.webp"))
    print(f"[TRAIN] Found {len(image_files)} training images in {img_dir}")
    
    if len(image_files) == 0:
        raise ValueError("No training images found in the uploaded ZIP file")
    
    return str(img_dir)


# ─────────────────────────────────────────────────────────────────
# TRAINING ENDPOINT
# ─────────────────────────────────────────────────────────────────

@app.function(
    image=gpu_image,
    gpu="L4",                           # L4 ~$0.80/hr (budget-friendly, 24GB VRAM)
    volumes={MODEL_DIR: volume},
    timeout=1200,                      # 20 min safety cap (500 steps ≈ 8 min)
    secrets=[modal.Secret.from_name("PixGen-Secrets")],
)
@modal.fastapi_endpoint(method="POST")
def train(data: dict):
    """
    Fine-tune FLUX.1-dev with LoRA on user-uploaded face images.
    
    Expected payload:
    {
        "zipUrl":      "https://...",           # URL to ZIP of training images
        "triggerWord":  "sks",                  # unique trigger word for the subject
        "modelId":      "uuid",                 # DB model ID
        "webhookUrl":   "https://api.../modal/webhook/train"
    }
    """
    import subprocess

    zip_url = data["zipUrl"]
    trigger_word = data["triggerWord"]
    model_id = data["modelId"]
    webhook_url = data["webhookUrl"]

    config = TrainConfig()
    output_dir = f"{MODEL_DIR}/{model_id}"
    status = "Generated"
    tensor_path = ""
    thumbnail_url = ""
    error_message = ""

    try:
        # ── Step 1: Download & extract training images ──────────
        train_data_dir = _prepare_training_images(zip_url, "/tmp/training_images")

        # ── Step 2: Run LoRA fine-tuning via accelerate ─────────
        #    Uses the official HuggingFace DreamBooth LoRA script
        #    Reference: https://huggingface.co/docs/diffusers/training/dreambooth#flux
        
        training_script = "/diffusers/examples/dreambooth/train_dreambooth_lora_flux.py"
        
        # Build the accelerate launch command
        cmd = [
            "accelerate", "launch",
            "--mixed_precision", config.mixed_precision,
            training_script,
            "--pretrained_model_name_or_path", BASE_MODEL,
            "--instance_data_dir",             train_data_dir,
            "--output_dir",                    output_dir,
            "--instance_prompt",               f"a photo of {trigger_word} person",
            "--resolution",                    str(config.resolution),
            "--train_batch_size",              str(config.train_batch_size),
            "--gradient_accumulation_steps",    str(config.gradient_accumulation_steps),
            "--learning_rate",                 str(config.learning_rate),
            "--lr_scheduler",                  config.lr_scheduler,
            "--max_train_steps",               str(config.max_train_steps),
            "--seed",                          str(config.seed),
            "--rank",                          str(config.lora_rank),
        ]

        # Add memory optimization flags
        if config.gradient_checkpointing:
            cmd.append("--gradient_checkpointing")

        print(f"[TRAIN] Starting LoRA fine-tuning for model {model_id}")
        print(f"[TRAIN] Trigger word: '{trigger_word}'")
        print(f"[TRAIN] Command: {' '.join(cmd)}")

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=1000,  # 16 min subprocess timeout (< Modal's 20 min)
        )

        if result.returncode != 0:
            print(f"[TRAIN] STDERR:\n{result.stderr[-2000:]}")  # last 2000 chars
            raise RuntimeError(
                f"Training script failed with exit code {result.returncode}: "
                f"{result.stderr[-500:]}"
            )

        print(f"[TRAIN] Training completed successfully")
        print(f"[TRAIN] STDOUT (last 1000 chars):\n{result.stdout[-1000:]}")

        # ── Step 3: Verify output & commit to volume ────────────
        lora_weights_path = Path(output_dir)
        
        # The training script outputs pytorch_lora_weights.safetensors
        safetensors_file = lora_weights_path / "pytorch_lora_weights.safetensors"
        if not safetensors_file.exists():
            # Fallback: check for other common output names
            alt_files = list(lora_weights_path.glob("*.safetensors"))
            if alt_files:
                safetensors_file = alt_files[0]
            else:
                raise FileNotFoundError(
                    f"No .safetensors file found in {output_dir}. "
                    f"Directory contents: {list(lora_weights_path.iterdir())}"
                )

        print(f"[TRAIN] LoRA weights saved to: {safetensors_file}")
        print(f"[TRAIN] File size: {safetensors_file.stat().st_size / 1024 / 1024:.1f} MB")

        volume.commit()
        tensor_path = f"modal-volume://{model_id}/{safetensors_file.name}"

        # NOTE: Thumbnail generation skipped to save budget.
        # The first user-generated image can serve as the thumbnail,
        # or re-enable this block when budget allows.
        # thumbnail_image = _run_inference(
        #     lora_weights_path=str(safetensors_file),
        #     prompt=f"a professional headshot photo of {trigger_word} person, studio lighting, neutral background",
        #     num_inference_steps=15,
        #     width=512, height=512,
        # )
        # s3_key = f"thumbnails/{model_id}.png"
        # thumbnail_url = _upload_to_s3(_pil_to_bytes(thumbnail_image), s3_key)

    except Exception as e:
        status = "Failed"
        error_message = str(e)
        print(f"[TRAIN] ERROR: {error_message}")
        import traceback
        traceback.print_exc()

    # ── Step 6: Send webhook back to Express backend ────────────
    payload = {
        "modelId": model_id,
        "status": status,
        "tensorPath": tensor_path,
        "thumbnailUrl": thumbnail_url,
        "error": error_message,
    }
    _send_webhook(webhook_url, payload)

    return {"status": status, "modelId": model_id}


# ─────────────────────────────────────────────────────────────────
# Shared inference function (used by /generate endpoint)
# ─────────────────────────────────────────────────────────────────

def _run_inference(
    lora_weights_path: str,
    prompt: str,
    num_inference_steps: int = 20,
    guidance_scale: float = 3.5,
    width: int = 512,
    height: int = 512,
):
    """
    Load FLUX.1-dev + LoRA weights and generate an image.
    
    Returns a PIL Image.
    """
    import torch
    from diffusers import FluxPipeline

    print(f"[INFERENCE] Loading base model: {BASE_MODEL}")

    # Load base Flux pipeline in FP16 for L4/T4
    pipe = FluxPipeline.from_pretrained(
        BASE_MODEL,
        torch_dtype=torch.float16,
    )
    pipe.to("cuda")

    # Load the trained LoRA weights
    print(f"[INFERENCE] Loading LoRA weights from: {lora_weights_path}")
    pipe.load_lora_weights(
        lora_weights_path,
        adapter_name="user_lora",
    )
    pipe.set_adapters(["user_lora"], adapter_weights=[1.0])

    # Enable memory-efficient attention if available
    try:
        pipe.enable_xformers_memory_efficient_attention()
    except Exception:
        pass  # xformers not installed, that's fine

    # Generate image
    print(f"[INFERENCE] Generating image: prompt='{prompt[:80]}...'" if len(prompt) > 80 else f"[INFERENCE] Generating image: prompt='{prompt}'")

    image = pipe(
        prompt=prompt,
        num_inference_steps=num_inference_steps,
        guidance_scale=guidance_scale,
        width=width,
        height=height,
        generator=torch.Generator("cuda").manual_seed(42),
    ).images[0]

    # Cleanup to free VRAM
    del pipe
    torch.cuda.empty_cache()

    print(f"[INFERENCE] Image generated: {image.size}")
    return image


# ─────────────────────────────────────────────────────────────────
# INFERENCE ENDPOINT
# ─────────────────────────────────────────────────────────────────

@app.function(
    image=gpu_image,
    gpu="T4",                          # T4 ~$0.59/hr (cheapest GPU, 16GB VRAM)
    volumes={MODEL_DIR: volume},
    timeout=120,              # 2 min max for inference
    max_containers=10,        # max 10 concurrent image generations
    secrets=[modal.Secret.from_name("PixGen-Secrets")],
)
@modal.fastapi_endpoint(method="POST")
def generate(data: dict):
    """
    Generate an image using a fine-tuned LoRA model.
    
    Expected payload:
    {
        "prompt":      "A headshot of sks person in a formal suit",
        "modelId":     "uuid",
        "imageId":     "uuid",
        "webhookUrl":  "https://api.../modal/webhook/image"
    }
    """
    model_id = data["modelId"]
    image_id = data["imageId"]
    prompt = data["prompt"]
    webhook_url = data["webhookUrl"]

    status = "Generated"
    image_url = ""
    error_message = ""

    try:
        # ── Step 1: Locate LoRA weights on the volume ───────────
        volume.reload()  # ensure latest weights are available

        lora_dir = Path(f"{MODEL_DIR}/{model_id}")
        lora_path = lora_dir / "pytorch_lora_weights.safetensors"
        
        if not lora_path.exists():
            # Fallback: search for any safetensors file
            alt_files = list(lora_dir.glob("*.safetensors"))
            if alt_files:
                lora_path = alt_files[0]
            else:
                raise FileNotFoundError(
                    f"No LoRA weights found for model {model_id}. "
                    f"Expected at {lora_path}"
                )

        print(f"[GENERATE] Using LoRA weights: {lora_path}")

        # ── Step 2: Run inference ───────────────────────────────
        generated_image = _run_inference(
            lora_weights_path=str(lora_path),
            prompt=prompt,
        )

        # ── Step 3: Upload to S3/R2 ────────────────────────────
        s3_key = f"outputs/{model_id}/{image_id}.png"
        image_url = _upload_to_s3(
            _pil_to_bytes(generated_image),
            s3_key,
        )
        print(f"[GENERATE] Image uploaded: {image_url}")

    except Exception as e:
        status = "Failed"
        error_message = str(e)
        print(f"[GENERATE] ERROR: {error_message}")
        import traceback
        traceback.print_exc()

    # ── Step 4: Send webhook back to Express backend ────────────
    payload = {
        "imageId": image_id,
        "status": status,
        "imageUrl": image_url,
        "error": error_message,
    }
    _send_webhook(webhook_url, payload)

    return {"status": status, "imageId": image_id}