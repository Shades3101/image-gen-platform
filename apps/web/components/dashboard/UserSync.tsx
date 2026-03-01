"use client";

import { useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { BACKEND_URL } from "@/app/config";

export default function UserSync() {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const { user } = useUser();
    const syncedRef = useRef(false);

    useEffect(() => {
        if (!isLoaded || !isSignedIn || !user || syncedRef.current) return;

        (async () => {
            try {
                const token = await getToken();
                if (!token) return;

                await axios.post(
                    `${BACKEND_URL}/user-auth`,
                    {
                        username: user.username || user.id,
                        profilePicture: user.imageUrl || "",
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                // Mark as synced for this session so we don't spam the backend
                syncedRef.current = true;
                console.log("User successfully synced with DB");
            } catch (error) {
                console.error("Failed to sync user with DB:", error);
            }
        })();
    }, [isLoaded, isSignedIn, user, getToken]);

    // This component renders nothing
    return null;
}
