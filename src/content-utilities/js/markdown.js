async function writeMarkdownResult() {
    console.log(params.get('url'))
    const response = await fetch(params.get('url'))
    const text = await response.text()

    const markdown = document.createElement('p');
    markdown.innerHTML = `\n${DOMPurify.sanitize(window.markdownit({html: false, breaks: true, typographer: true, linkify: false}).render(text))}`;

    document.querySelector('body').appendChild(markdown);
}
writeMarkdownResult()