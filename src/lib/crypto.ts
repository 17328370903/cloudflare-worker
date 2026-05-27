export async function hashPassword(password: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(password);
	
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		data,
		{ name: "PBKDF2" },
		false,
		["deriveKey"]
	);
	
	const key = await crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			salt: salt,
			iterations: 100000,
			hash: "SHA-256",
		},
		keyMaterial,
		{ name: "AES-GCM", length: 256 },
		true,
		["encrypt", "decrypt"]
	);
	
	const exportedKey = await crypto.subtle.exportKey("raw", key);
	const hash = Array.from(new Uint8Array(exportedKey))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	
	const saltHex = Array.from(salt)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	
	return `${saltHex}:${hash}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
	const [saltHex, storedHashValue] = storedHash.split(":");
	
	if (!saltHex || !storedHashValue) {
		return false;
	}
	
	const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
	const encoder = new TextEncoder();
	const data = encoder.encode(password);
	
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		data,
		{ name: "PBKDF2" },
		false,
		["deriveKey"]
	);
	
	const key = await crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			salt: salt,
			iterations: 100000,
			hash: "SHA-256",
		},
		keyMaterial,
		{ name: "AES-GCM", length: 256 },
		true,
		["encrypt", "decrypt"]
	);
	
	const exportedKey = await crypto.subtle.exportKey("raw", key);
	const computedHash = Array.from(new Uint8Array(exportedKey))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	
	return computedHash === storedHashValue;
}