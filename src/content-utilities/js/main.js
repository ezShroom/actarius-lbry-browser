const params = new URL(window.location).searchParams;

document.querySelector('title').innerText = params.get('title');

const title = document.createElement('h1');
title.innerText = params.get('title');


let dateArray = new Date(parseInt(params.get('timestamp')) * 1000).toLocaleString('en-GB', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'}).split(' ')
    dateArray[0] = dateArray[0].slice(0, -1) // Remove , from end of weekday
    switch (dateArray[1]) {
        case 1:
        case 21:
        case 31:
            dateArray[1] = dateArray[1] + '<sup>st</sup>'
            break
        case 2:
        case 22:
            dateArray[1] = dateArray[1] + '<sup>nd</sup>'
            break
        case 3:
        case 23:
            dateArray[1] = dateArray[1] + '<sup>rd</sup'
            break
        default:
            dateArray[1] = dateArray[1] + '<sup>th</sup>'
            break
    }
console.log(dateArray.join(' '))
const date = document.createElement('p');
date.id = 'date';
date.innerHTML = dateArray.join(' ');

const body = document.querySelector('body');
body.innerHTML = '';
body.appendChild(title);
body.appendChild(date);