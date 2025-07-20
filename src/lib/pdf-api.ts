
const API_URL = process.env.NEXT_PUBLIC_PDF_API_URL || 'http://localhost:5000';

export async function callPdfApi(
    endpoint: 'lock' | 'unlock',
    file: File,
    password?: string,
): Promise<Blob> {
    const formData = new FormData();
    formData.append('file', file);
    if (password) {
        formData.append('password', password);
    }

    try {
        const response = await fetch(`${API_URL}/${endpoint}`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Failed to ${endpoint} the PDF.`);
        }

        return await response.blob();
    } catch (err: any) {
        if (err.message.includes('Failed to fetch')) {
            throw new Error('Could not connect to the server. Please check your connection and try again.');
        }
        throw err;
    }
}
