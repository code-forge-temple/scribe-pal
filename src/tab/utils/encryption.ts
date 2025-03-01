/************************************************************************
 *    Copyright (C) 2025 Code Forge Temple                              *
 *    This file is part of scribe-pal project                           *
 *    Licensed under the GNU General Public License v3.0.               *
 *    See the LICENSE file in the project root for more information.    *
 ************************************************************************/

import {EXTENSION_NAME} from "../../common/constants";

export async function generateKey (): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
        {
            name: 'AES-GCM',
            length: 256
        },
        true,
        ['encrypt', 'decrypt']
    );
}

async function getKey (): Promise<CryptoKey> {
    const extensionNamespace = (window as any)[EXTENSION_NAME];
    if (!extensionNamespace?.encryption?.key) {
        throw new Error('Encryption key not found in extension namespace');
    }
    return extensionNamespace.encryption.key;
}

export async function encrypt<T> (data: T): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(JSON.stringify(data));
    const key = await getKey();
    const encryptedContent = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv
        },
        key,
        encodedData
    );

    const result = new Uint8Array(iv.length + encryptedContent.byteLength);

    result.set(iv);
    result.set(new Uint8Array(encryptedContent), iv.length);

    return btoa(String.fromCharCode(...Array.from(result)));
}

export async function decrypt<T> (encryptedData: string): Promise<T> {
    const combined = new Uint8Array(
        atob(encryptedData).split('').map(c => c.charCodeAt(0))
    );
    const iv = combined.slice(0, 12);
    const content = combined.slice(12);
    const key = await getKey();
    const decrypted = await crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv
        },
        key,
        content
    );
    const decoded = new TextDecoder().decode(decrypted);

    return JSON.parse(decoded);
}

export const windowPostEncryptedMessage = (data: Record<string, any>, key: string) => {
    if(!(key in data)) {
        throw new Error(`Key ${key} not found in data`);
    }

    encrypt(data[key]).then(encryptedValue => {
        window.postMessage(
            {
                ...data,
                [key]: encryptedValue
            },
            "*"
        );
    });
}