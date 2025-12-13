import * as admin from 'firebase-admin';
import { serverEnv } from './env';

let adminApp: admin.app.App | null = null;

function getAdminApp() {
    if (adminApp) {
        return adminApp;
    }

    if (!admin.apps.length) {
        const options: admin.AppOptions = {
            projectId: serverEnv.FIREBASE_PROJECT_ID,
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

    adminApp = admin.app();
    return adminApp;
}

function getDb() {
    return getAdminApp().firestore();
}

export { getDb, getAdminApp };
