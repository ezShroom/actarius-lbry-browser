const audio = document.createElement('audio');
audio.src = params.get('url');
audio.controls = true;
console.log("hello");

document.querySelector('body').appendChild(body.appendChild(audio));