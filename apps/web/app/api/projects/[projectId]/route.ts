import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Project } from '@/lib/types';
import type admin from 'firebase-admin';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        const body = await request.json();
        const {
            name,
            baseUrl,
            description,
            tone,
            language,
            aiSummary,
            aiDetails,
            scriptDefaults,
        } = body;

        if (!name || !baseUrl || !description || !tone || !language) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const db = getDb();
        const projectRef = db.collection('projects').doc(projectId);

        // Verify project exists
        const doc = await projectRef.get();
        if (!doc.exists) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        const updates: Partial<Project> = {
            name,
            baseUrl,
            description,
            tone,
            language,
            ...(typeof aiSummary !== 'undefined' && { aiSummary: aiSummary || null }),
            ...(typeof aiDetails !== 'undefined' && { aiDetails: aiDetails || null }),
            ...(typeof scriptDefaults !== 'undefined' && { scriptDefaults }),
        };

        await projectRef.update(updates);

        return NextResponse.json({
            id: projectId,
            ...doc.data(),
            ...updates,
        });

    } catch (error) {
        console.error('Error updating project:', error);
        return NextResponse.json(
            { error: 'Failed to update project' },
            { status: 500 }
        );
    }
}

/**
 * Recursively delete all documents in a subcollection
 */
async function deleteSubcollection(
    db: admin.firestore.Firestore,
    collectionRef: admin.firestore.CollectionReference,
    batchSize: number = 500
): Promise<void> {
    const snapshot = await collectionRef.limit(batchSize).get();
    
    if (snapshot.empty) {
        return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    // If we got a full batch, there might be more to delete
    if (snapshot.size === batchSize) {
        return deleteSubcollection(db, collectionRef, batchSize);
    }
}

/**
 * Recursively delete all subcollections of a document
 */
async function deleteDocumentWithSubcollections(
    db: admin.firestore.Firestore,
    docRef: admin.firestore.DocumentReference
): Promise<void> {
    // Get all subcollections
    const subcollections = await docRef.listCollections();
    
    // Delete all subcollections recursively
    for (const subcollection of subcollections) {
        // For pages, we need to delete their subcollections too
        if (subcollection.id === 'pages') {
            const pagesSnapshot = await subcollection.get();
            for (const pageDoc of pagesSnapshot.docs) {
                // Delete page subcollections (segments, snapshots)
                const pageSubcollections = await pageDoc.ref.listCollections();
                for (const pageSubcollection of pageSubcollections) {
                    // For segments, delete their versions subcollection
                    if (pageSubcollection.id === 'segments') {
                        const segmentsSnapshot = await pageSubcollection.get();
                        for (const segmentDoc of segmentsSnapshot.docs) {
                            const legacyVersionsRef = segmentDoc.ref.collection('versions');
                            const scriptVersionsRef = segmentDoc.ref.collection('scriptVersions');
                            await deleteSubcollection(db, legacyVersionsRef);
                            await deleteSubcollection(db, scriptVersionsRef);
                        }
                    }
                    await deleteSubcollection(db, pageSubcollection);
                }
            }
        } else if (subcollection.id === 'segments') {
            // For project-level segments, delete their versions if they exist
            const segmentsSnapshot = await subcollection.get();
            for (const segmentDoc of segmentsSnapshot.docs) {
                const legacyVersionsRef = segmentDoc.ref.collection('versions');
                const scriptVersionsRef = segmentDoc.ref.collection('scriptVersions');
                await deleteSubcollection(db, legacyVersionsRef);
                await deleteSubcollection(db, scriptVersionsRef);
            }
        }
        
        await deleteSubcollection(db, subcollection);
    }
    
    // Finally, delete the document itself
    await docRef.delete();
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;

        if (!projectId) {
            return NextResponse.json(
                { error: 'Missing projectId' },
                { status: 400 }
            );
        }

        const db = getDb();
        const projectRef = db.collection('projects').doc(projectId);

        // Verify project exists
        const doc = await projectRef.get();
        if (!doc.exists) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        // Delete project and all its subcollections recursively
        await deleteDocumentWithSubcollections(db, projectRef);

        return NextResponse.json({
            id: projectId,
            deleted: true,
        });

    } catch (error) {
        console.error('Error deleting project:', error);
        return NextResponse.json(
            { error: 'Failed to delete project' },
            { status: 500 }
        );
    }
}
