import * as admin from 'firebase-admin';
import { serverEnv } from './env';

function normalizeBucketName(bucket?: string): string | undefined {
    if (!bucket) return bucket;
    // Strip gs:// prefix if present (only used for gsutil commands)
    const normalized = bucket.replace(/^gs:\/\//, '');
    // Return as-is - don't convert .firebasestorage.app to .appspot.com
    return normalized;
}

// Initialize Firebase Admin if not already done
function getStorage() {
    if (!admin.apps.length) {
        const storageBucket = normalizeBucketName(
            serverEnv.FIREBASE_STORAGE_BUCKET
            || (serverEnv.FIREBASE_PROJECT_ID ? `${serverEnv.FIREBASE_PROJECT_ID}.appspot.com` : undefined)
        );

        if (!storageBucket) {
            throw new Error('Missing Firebase storage bucket. Set FIREBASE_STORAGE_BUCKET.');
        }

        const options: admin.AppOptions = {
            projectId: serverEnv.FIREBASE_PROJECT_ID,
            storageBucket,
        };

        if (serverEnv.FIREBASE_CLIENT_EMAIL && serverEnv.FIREBASE_PRIVATE_KEY) {
            options.credential = admin.credential.cert({
                projectId: serverEnv.FIREBASE_PROJECT_ID,
                clientEmail: serverEnv.FIREBASE_CLIENT_EMAIL,
                privateKey: serverEnv.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            });
        }

        admin.initializeApp(options);
    }
    return admin.storage();
}

/**
 * Verify that Firebase Storage is accessible before attempting to use it.
 * This helps avoid wasting API tokens (e.g., ElevenLabs) if storage is not available.
 */
export async function verifyStorageAccess(): Promise<void> {
    const storage = getStorage();
    
    // Get bucket name using the same logic as getStorage()
    const bucketName = normalizeBucketName(
        serverEnv.FIREBASE_STORAGE_BUCKET
        || (serverEnv.FIREBASE_PROJECT_ID ? `${serverEnv.FIREBASE_PROJECT_ID}.appspot.com` : undefined)
    );
    
    if (!bucketName) {
        throw new Error('Missing Firebase storage bucket. Set FIREBASE_STORAGE_BUCKET.');
    }
    
    const bucket = storage.bucket(bucketName);
    
    try {
        // Check if bucket exists and is accessible
        const [exists] = await bucket.exists();
        if (!exists) {
            throw new Error(
                `Firebase Storage bucket not found: "${bucketName}". ` +
                `Please verify that the bucket exists in Google Cloud Console and that ` +
                `FIREBASE_STORAGE_BUCKET is set correctly in your environment variables.`
            );
        }
        
        // Verify we have write permissions by checking bucket metadata
        // This is a lightweight operation that confirms access
        await bucket.getMetadata();
        
        if (process.env.NODE_ENV === 'development') {
            console.log('[Storage] Verified access to bucket:', bucketName);
        }
    } catch (error: unknown) {
        const storageError = error as {
            code?: number;
            response?: { status?: number };
            message?: string;
        };
        // Handle 404 errors specifically (bucket not found)
        if (storageError?.code === 404 || storageError?.response?.status === 404) {
            const errorMessage = `Firebase Storage bucket not found: "${bucketName}". ` +
                `Please verify that the bucket exists in Google Cloud Console and that ` +
                `FIREBASE_STORAGE_BUCKET is set correctly in your environment variables. ` +
                `Expected bucket: prodfact-landing-voice-agent.firebasestorage.app`;
            console.error('[Storage Verification Error]', errorMessage);
            throw new Error(errorMessage);
        }
        
        // Handle permission errors
        if (storageError?.code === 403 || storageError?.response?.status === 403) {
            const errorMessage = `Firebase Storage access denied for bucket: "${bucketName}". ` +
                `Please verify that your service account has Storage Admin or Storage Object Admin permissions.`;
            console.error('[Storage Verification Error]', errorMessage);
            throw new Error(errorMessage);
        }
        
        // Re-throw other errors with context
        const errorMessage = storageError?.message || 'Failed to verify Firebase Storage access';
        console.error('[Storage Verification Error]', `Bucket: ${bucketName}`, error);
        throw new Error(`${errorMessage} (bucket: ${bucketName})`);
    }
}

export async function saveAudioFile(buffer: ArrayBuffer, fileNamePrefix: string): Promise<string> {
    const fileName = `audio/${fileNamePrefix}-${Date.now()}.mp3`;
    const storage = getStorage();
    
    // Get bucket name using the same logic as getStorage()
    const bucketName = normalizeBucketName(
        serverEnv.FIREBASE_STORAGE_BUCKET
        || (serverEnv.FIREBASE_PROJECT_ID ? `${serverEnv.FIREBASE_PROJECT_ID}.appspot.com` : undefined)
    );
    
    if (!bucketName) {
        throw new Error('Missing Firebase storage bucket. Set FIREBASE_STORAGE_BUCKET.');
    }
    
    // Log bucket name in development for debugging
    if (process.env.NODE_ENV === 'development') {
        console.log('[Storage] Using bucket:', bucketName);
    }
    
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);

    try {
        // Upload buffer to Firebase Storage
        await file.save(Buffer.from(buffer), {
            metadata: {
                contentType: 'audio/mpeg',
            },
            public: true, // Make file publicly accessible
        });

        // Return public URL
        return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    } catch (error: unknown) {
        const storageError = error as {
            code?: number;
            response?: { status?: number };
            message?: string;
        };
        // Handle 404 errors specifically (bucket not found)
        if (storageError?.code === 404 || storageError?.response?.status === 404) {
            const errorMessage = `Firebase Storage bucket not found: "${bucketName}". ` +
                `Please verify that the bucket exists in Google Cloud Console and that ` +
                `FIREBASE_STORAGE_BUCKET is set correctly in your environment variables. ` +
                `Expected bucket: prodfact-landing-voice-agent.firebasestorage.app`;
            console.error('[Storage Error]', errorMessage);
            throw new Error(errorMessage);
        }
        
        // Re-throw other errors with bucket name context
        const errorMessage = storageError?.message || 'Failed to save audio file to Firebase Storage';
        console.error('[Storage Error]', `Bucket: ${bucketName}`, error);
        throw new Error(`${errorMessage} (bucket: ${bucketName})`);
    }
}
