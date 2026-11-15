import {json, nativeContent} from '../../api/content.server';

// The iPhone app asks this first and downloads /api/v1/content only when the version changed.
export const loader = () => json({version: nativeContent().version}, {headers: {'Cache-Control': 'public, max-age=60'}});
