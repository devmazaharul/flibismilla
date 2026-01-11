import React, { Suspense } from 'react';
import Packagesclient from './[slug]/Packagesclient';

export default function page() {
    return (
        <div>
            <Suspense>
                <Packagesclient />
            </Suspense>
        </div>
    );
}
