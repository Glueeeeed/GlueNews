import 'dotenv/config';

// If is true, connection using https. Check ssl.ts to fill ssl certificate.
export const httpsMode : boolean = false;
// Enter your domain (If locally type http://localhost)
export const domain : string = "http://localhost";
//Runs application on the selected port
export const PORT : number = 2137;
// If is true, CORS is enabled
export const corsEnabled : boolean = true;
