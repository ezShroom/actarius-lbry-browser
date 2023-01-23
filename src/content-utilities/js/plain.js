const plain = document.createElement('p');

(async ()=>{
    let text = await fetch(params.get('url'));
    text = await text.text();
    plain.innerText = text;
    document.querySelector('body').appendChild(body.appendChild(plain));
})()
