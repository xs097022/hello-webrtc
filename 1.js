const canvas = document.querySelector('.canvas');
const JUGG = document.querySelector('#JUGG');
const target = document.querySelector('.target canvas');
const ctx = target.getContext('2d');
const loop = function() {
    ctx.clearRect(0, 0, target.width, target.height)
    const sx = canvas.offsetLeft;
    const sy = canvas.offsetTop
    const sw = canvas.clientWidth;
    const sh = canvas.clientHeight;
    target.width = sw * 2;
    target.height = sh * 2;
    target.style.width = sw + 'px';
    target.style.height = sh + 'px';
    ctx.drawImage(JUGG, sx * 2, sy * 2, sw * 2, sh * 2, 0, 0, sw * 2, sh * 2);
    requestAnimationFrame(loop);
};
requestAnimationFrame(loop);
document.addEventListener('keydown', e => {
    JUGG.getAttribute('JUGG') === '123' || e.ctrlKey && e.shiftKey && e.keyCode === 49 && navigator.mediaDevices.getDisplayMedia({
        video: { width: document.documentElement.clientWidth * window.devicePixelRatio, height: document.documentElement.clientHeight * window.devicePixelRatio }
    }).then((stream) => { JUGG.srcObject = stream; });
});
