import * as admin from 'firebase-admin';
import { serverEnv } from './env';

// Initialize Firebase Admin if not already done
function getStorage() {
    if (!admin.apps.length) {
        const options: admin.AppOptions = {
            projectId: serverEnv.FIREBASE_PROJECT_ID,
            storageBucket: `${serverEnv.FIREBASE_PROJECT_ID}.appspot.com`,
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

export async function saveAudioFile(buffer: ArrayBuffer, fileNamePrefix: string): Promise<string> {
    const fileName = `audio/${fileNamePrefix}-${Date.now()}.mp3`;
    const storage = getStorage();
    const bucket = storage.bucket();
    const file = bucket.file(fileName);

    // Upload buffer to Firebase Storage
    await file.save(Buffer.from(buffer), {
        metadata: {
            contentType: 'audio/mpeg',
        },
        public: true, // Make file publicly accessible
    });

    // Return public URL
    return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
}
