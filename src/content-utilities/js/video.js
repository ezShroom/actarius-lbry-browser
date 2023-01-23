const video = document.createElement('video');
video.src = params.get('url');
video.controls = true;

document.querySelector('body').appendChild(video);