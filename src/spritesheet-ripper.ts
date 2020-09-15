import { to32BitValidIn8Bit, to8Bit, toBinary} from './colour-conversion.js';
import { downloadBlob } from './download.js';

const tilesize = 16;
const width = 2;
const height = 3;
const numberOfFrames = 10; //11;
const rowWidth = (tilesize * width) * numberOfFrames;

let animationContext;
let myContext;
let frame = 0;
let palettePointer = 0;

var img = document.getElementById('my-image') as HTMLImageElement;
img.addEventListener('load', function () {
	var canvasAnimation = document.createElement('canvas');
	canvasAnimation.width = tilesize * width;
	canvasAnimation.height = tilesize * height;
	animationContext = canvasAnimation.getContext('2d');
	img.after(canvasAnimation);

	var canvas = document.createElement('canvas');
	canvas.width = img.width;
	canvas.height = img.height;
	myContext = canvas.getContext('2d');
	myContext.drawImage(img, 0, 0, img.width, img.height);
	img.after(canvas);

	var id = myContext.createImageData(1, 1); // only do this once per page
	var d = id.data; // only do this once per page
	d[3] = 255;
	// console.log(d);

	const palette = [];
	const numberOfPixels = rowWidth * (tilesize * height);
	const pixels = new Uint8Array(numberOfPixels);

	var y = 0;
	var convertLine = function () {
		for (let x = 0; x < img.width; x++) {
			var pixel = myContext.getImageData(x, y, 1, 1).data;

			let rgb = [];
			for (let i = 0; i < pixel.length - 1; i++) {
				let result = to8Bit(pixel[i]);
				rgb.push(result);
				d[i] = to32BitValidIn8Bit(pixel[i]);
			}

			const found = palette.some((p) => {
				if (rgb[0] === p.colour[0] && rgb[1] === p.colour[1] && rgb[2] === p.colour[2]) {
					pixels[(y*rowWidth)+x] = p.index;
					return true;
				}
				return false;
			});
			if (found === false) {
				if (rgb[0] === 0 && rgb[1] === 0 && rgb[2] === 0) {
					pixels[(y*rowWidth)+x] = 227;
				} else {
					palette.push({
						colour: rgb,
						index: palettePointer
					});
					pixels[(y*rowWidth)+x] = palettePointer;
					palettePointer++;
				}
			}
			myContext.putImageData(id, x, y);
		}

		y++;
		if (y < img.height) {
			// requestAnimationFrame(convertLine);
			convertLine();
		} else {
			let filename = img.src;
			filename = filename.split('.').slice(0, -1).join('.')
			let n = filename.lastIndexOf('/');
			filename = filename.substring(n + 1);

			var uint8 = new Uint8Array(512);
			palette.forEach((p, index) => {
				const binary = toBinary(p.colour[0]) + toBinary(p.colour[1]) + toBinary(p.colour[2]);
				const i = index*2;
				uint8[i] = parseInt(binary.substr(0, 8), 2);
				uint8[i+1] = parseInt(binary.substr(8, 1), 2);
			});
			downloadBlob(uint8, `${filename}.pal`);

			const uint8Sprite = spriteSheetArrayToSpriteArray(pixels, width, height, numberOfFrames);
			downloadBlob(uint8Sprite, `${filename}.spr`);

			drawFrame(frame);
			setInterval(incrementFrame, 70);
		}
	}

	requestAnimationFrame(convertLine);
});
img.src = 'img/turn2.png'; // '/throw.png'; //'/turn.png';

function incrementFrame() {
	frame++;
	if (frame === numberOfFrames) {
		frame = 0;
	}
	drawFrame(frame);
}

function drawFrame(frame: number) {
	let firstFrame = myContext.getImageData((tilesize * width) * frame, 0, tilesize * width, tilesize * height).data;
	firstFrame = new ImageData(firstFrame, tilesize * width);
	animationContext.putImageData(firstFrame, 0, 0);
}

function spriteSheetArrayToSpriteArray(pixels: Uint8Array, frameWidthInTiles: number, frameHeightInTiles: number, numberOfFrames: number, tilesize = 16): Uint8Array {
	const uint8Sprite = new Uint8Array(16384);
	let pointer = 0;
	for (let f = 0; f < numberOfFrames; f++) {
		for (let h = 0; h < frameHeightInTiles; h++) {
			for (let w = 0; w < frameWidthInTiles; w++) {
				for (let y = h*tilesize; y < (h*tilesize)+tilesize; y++) {
					// for (let x = (w*tilesize)*f; x < ((w*tilesize)*f)+tilesize; x++) {
					let thing = ((tilesize*frameWidthInTiles)*f) + (w*tilesize);
					for (let x = thing; x < thing + tilesize; x++) {
						// console.log(x,y, pixels[(y*rowWidth)+x]);
						uint8Sprite[pointer] = pixels[(y*rowWidth)+x];
						pointer++
					}
				}
			}
		}
	}
	return uint8Sprite;
}