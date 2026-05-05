import { supabase } from './supabase';

/**
 * Uploads an image file to a Supabase storage bucket and returns its public URL.
 * 
 * @param {File} file - The file to upload.
 * @param {string} bucket - The name of the Supabase storage bucket (default: 'images').
 * @param {string} folder - Optional folder path inside the bucket (e.g., 'staff' or 'shops').
 * @returns {Promise<string>} The public URL of the uploaded image.
 */
export async function uploadImage(file, bucket = 'images', folder = '') {
    if (!file) throw new Error('No file provided for upload.');

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) {
        console.error('Upload Error:', error.message);
        throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error('Failed to retrieve public URL after upload.');
    }

    return publicUrlData.publicUrl;
}
