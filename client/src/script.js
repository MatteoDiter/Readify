//ClientID: '42c01af939954a35a024a9d4aee4b125'
//Redirect_URI: 'http://localhost:8080/api/callback'
//Scope: 'user-read-private user-read-email playlist-modify-public playlist-modify-private'

const clientId = "42c01af939954a35a024a9d4aee4b125"; // Replace with your client ID
const params = new URLSearchParams(window.location.search);
const code = params.get("code");

function getCookie(name) {
  // document.cookie.match returns an arr of regex, name, and boolean
  const cookieValue = document.cookie.match(
    // this regex does the following
    // ^ matches the beginning of the string
    // |[^;]+ matches any character that is not a semicolon
    // \s* matches any whitespace
    // + matches the previous token 1 or more times
    // \s* matches any whitespace
    // = matches the = character
    // \s* matches any whitespace
    // ([^;]+) matches any character that is not a semicolon 1 or more times
    // the whole thing is wrapped in parentheses to create a capture group
      '(^|[^;]+)\\s*' + name + '\\s*=\\s*([^;]+)'
  );
  return cookieValue ? cookieValue.pop() : '';
}

if (!code) {
    redirectToAuthCodeFlow(clientId);
    console.log('we are in the first if statement')
} else {
    console.log('we are in the else statement')

    const accessToken = await getAccessToken(clientId, code);
    const getCookieToken = getCookie('Token')

    if (accessToken !== undefined) {
      document.cookie = `Token=${accessToken}`
    }
    
    // GRAB USER ID FROM THE PROFILE RETURN OBJECT
    const profile = await fetchProfile(accessToken);
    const getCookieUser = getCookie('User')
    if (profile.id !== undefined || getCookieUser === '') {
      document.cookie = `User=${profile.id}`
      // add a location reload 
      location.reload();
    }
}

async function redirectToAuthCodeFlow(clientId) {
  const verifier = generateCodeVerifier(128);
  const challenge = await generateCodeChallenge(verifier);

  localStorage.setItem("verifier", verifier);

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("response_type", "code");
  params.append("redirect_uri", "http://localhost:8080/api/callback");
  params.append("scope", "user-read-private user-read-email playlist-modify-public playlist-modify-private");
  params.append("code_challenge_method", "S256");
  params.append("code_challenge", challenge);

  document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
  console.log('after doc.location')
}

function generateCodeVerifier(length) {
  let text = '';
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function generateCodeChallenge(codeVerifier) {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
}

async function getAccessToken(clientId, code) {
  const verifier = localStorage.getItem("verifier");

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", "http://localhost:8080/api/callback");
  params.append("code_verifier", verifier);

  const result = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
  });

  const { access_token } = await result.json();
  return access_token;
  
}

async function fetchProfile(token) {
  console.log('token from inside fetchProfile', token)
  const result = await fetch("https://api.spotify.com/v1/me", {
    method: "GET", headers: { Authorization: `Bearer ${token}` }
  });
  // data received should be an object with an ID attribute
  await console.log('this should be an object with a lot of info on the user: ', result)
  // save User
  const data = await result.json();
  console.log ('data', data)
  return data; 
}