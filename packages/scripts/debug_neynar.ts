import { env } from './src/config/env.js';

async function debug() {
    console.log('--- DEBUG NEYNAR ---');
    console.log('Signer UUID:', env.farcasterSignerUuid);

    const signerRes = await fetch(`https://api.neynar.com/v2/farcaster/signer?signer_uuid=${env.farcasterSignerUuid}`, {
        headers: { 'api_key': env.neynarApiKey }
    });
    const signerData = await signerRes.json();
    console.log('Signer Data:', JSON.stringify(signerData, null, 2));

    if (signerData.fid) {
        const userRes = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${signerData.fid}`, {
            headers: { 'api_key': env.neynarApiKey }
        });
        const userData = await userRes.json();
        const user = userData.users[0];
        console.log('--- USER PROFILE ---');
        console.log('FID:', user.fid);
        console.log('Custody Address:', user.custody_address);
        console.log('Verified Addresses:', JSON.stringify(user.verified_addresses || [], null, 2));
        console.log('Verified Eth Addresses:', JSON.stringify(user.verifications || [], null, 2));
    }
}

debug().catch(console.error);
