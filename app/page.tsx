import CryptoJS from 'crypto-js';

function generateCodeVerifier() {
  return generateRandomString(96);
}

function generateRandomString(length) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function generateCodeChallenge(code_verifier) {
  return CryptoJS.SHA256(code_verifier);
}

function base64URL(string) {
  return string.toString(CryptoJS.enc.Base64).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

var verifier = base64URL(generateCodeVerifier());
var challenge = base64URL(generateCodeChallenge(verifier));


const DATA_SOURSE_VERIFICATTION_START = "https://kv7kzm78.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/f_ecom_zzrl_059/oauth2/authorize?redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback&response_type=code&client_id=aeef000c-c4c6-4e7e-96db-a98ee36c6292&hint=guest&code_challenge="

async function GetTokenRequestVars() { 
  //console.log('request from api challenge' ,challenge); 
  var url = DATA_SOURSE_VERIFICATTION_START + challenge;
  //console.log('request from api url' ,url);
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    redirect: "manual" 
  })   
  //console.log('response from api GetTokenRequestVars' ,res);  
  var test = await res; 
  //console.log('response from api GetTokenRequestVars test' ,test.headers);
  return await res;  
}
const DATA_SOURSE_URL_GET_TOKEN = "https://kv7kzm78.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/f_ecom_zzrl_059/oauth2/token"

function Format(linkString) {
  var mySubStringCode= linkString.substring(
    linkString.indexOf("code=") + 5
); 
var mySubStringUsid = linkString.substring( 
  linkString.indexOf("usid=") + 5, 
  linkString.lastIndexOf("&")
);
  return [mySubStringCode, mySubStringUsid];
}

async function GetToken() {
  const reponse = await GetTokenRequestVars(); 
  //onsole.log('The reponse' ,reponse.headers.get('location')); 
  var stringValue = Format(reponse.headers.get('location'));
  //console.log('TheTokenStringValue' ,stringValue);  
  const res = await fetch(DATA_SOURSE_URL_GET_TOKEN, { 
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    method: 'POST',
    redirect: "manual" , 
    body: new URLSearchParams({
      'code': stringValue[0], 
      'grant_type': 'authorization_code_pkce',
      'redirect_uri': 'http://localhost:3000/callback',
      'code_verifier': verifier,
      'channel_id': 'RefArch',
      'client_id': 'aeef000c-c4c6-4e7e-96db-a98ee36c6292',
      'usid': stringValue[1] 
    })
  
  })

  const result = await res.json(); 
  //console.log('response from api GetToken' ,result);  
  return result;
  
}
const DATA_SOURSE_URL_GET_PRODUCTS = "https://kv7kzm78.api.commercecloud.salesforce.com/search/shopper-search/v1/organizations/f_ecom_zzrl_059/product-search?siteId=RefArch&q=shirt"

  async function GetProducts() { 
    const token = await GetToken();
    const res = await fetch(DATA_SOURSE_URL_GET_PRODUCTS, {
      headers: {
        Authorization: 'Bearer ' + token.access_token,
        "Content-Type": "application/json" 
      } 
    });
    const result = await res.json(); 
     console.log('response from api' ,result.hits);   
    //  console.log('response from api' ,result.data[0].imageGroups[0].images[0].alt);

    return result.hits;
    
  }


export default async function Example() {
  const responsess = await GetProducts();
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <h2 className="sr-only">Products</h2>

        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
          {responsess.map((responsess) => (
            <a key={responsess.API} href={responsess.slugUrl} className="group">
              <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-lg bg-gray-200 xl:aspect-h-8 xl:aspect-w-7">
                <img
                  src={responsess.image.disBaseLink}
                  alt={responsess.image.alt}
                  className="h-full w-full object-cover object-center group-hover:opacity-75"
                />
              </div>
              <p className="mt-1 text-lg font-medium text-gray-900">{responsess.name}</p>
              <p className="mt-1 text-lg font-medium text-gray-900">{responsess.price} {responsess.currency}</p>
              <p className="mt-1 text-lg font-medium text-gray-900">Details:</p>
              <h6 className="mt-4 text-sm text-gray-700">{responsess.longDescription}</h6>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}