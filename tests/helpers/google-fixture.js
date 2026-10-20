// Local Google substitute: real RSA signatures, no Google account or production credentials.
import {generateKeyPairSync,sign} from 'node:crypto';
export const googleConfig={clientId:'1234567890-qa.apps.googleusercontent.com',clientSecret:'synthetic-google-secret'};
export function googleFixture(){
 const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
 const jwk={...publicKey.export({format:'jwk'}),kid:'qa-key',use:'sig',alg:'RS256'};
 let nonce,claims={},header={},badSignature=false,tokenCalls=0;
 const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
 return {
  setNonce:value=>{nonce=value;},claims:value=>{claims=value;},header:value=>{header=value;},badSignature:()=>{badSignature=true;},calls:()=>tokenCalls,
  async fetcher(url,options){
   if(url==='https://www.googleapis.com/oauth2/v3/certs')return Response.json({keys:[jwk]});
   if(url!=='https://oauth2.googleapis.com/token')throw Error('Unexpected endpoint');
   tokenCalls++;if(options.body.get('client_secret')!==googleConfig.clientSecret||options.body.get('grant_type')!=='authorization_code'||!options.body.get('code_verifier'))throw Error('Invalid exchange');
   const time=Math.floor(Date.now()/1000),payload=encode({alg:'RS256',kid:'qa-key',...header})+'.'+encode({iss:'https://accounts.google.com',aud:googleConfig.clientId,iat:time,exp:time+3600,nonce,email:'carlossuess@gmail.com',email_verified:true,sub:'unique-google-admin',...claims});
   return Response.json({id_token:payload+'.'+(badSignature?Buffer.alloc(256):sign('RSA-SHA256',Buffer.from(payload),privateKey)).toString('base64url')});
  }
 };
}
