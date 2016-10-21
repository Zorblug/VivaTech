'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MonochromeBmpFrom = MonochromeBmpFrom;
exports.MonochromeBmpFrom2 = MonochromeBmpFrom2;
/**
 * depth: 1 - monochrome
 *        4 - 4-bit grayscale
 *        8 - 8-bit grayscale
 *       16 - 16-bit colour
 *       32 - 32-bit colour
 **/
function MonochromeBmpFrom(width, height, data, depth) {

  function conv(size) {
    return String.fromCharCode(size & 0xff, size >> 8 & 0xff, size >> 16 & 0xff, size >> 24 & 0xff);
  }

  var offset = depth <= 8 ? 54 + Math.pow(2, depth) * 4 : 54;

  var rawData = 'BM';
  rawData += conv(offset + data.length); // BMP size
  rawData += conv(0); // unused
  rawData += conv(offset); // pixel data offset

  //DIB Header
  rawData += conv(40); // DIB header length
  rawData += conv(height); // image height
  rawData += conv(width); // image width
  rawData += String.fromCharCode(1, 0); // colour panes
  rawData += String.fromCharCode(depth, 0); // bits per pixel
  rawData += conv(0); // compression method
  rawData += conv(data.length); // size of the raw rawData
  rawData += conv(2835); // horizontal print resolution
  rawData += conv(2835); // vertical print resolution
  rawData += conv(0); // colour palette, 0 == 2^n
  rawData += conv(0); // important colours

  //Grayscale tables for bit depths <= 8
  if (depth <= 8) {
    rawData += conv(0);

    for (var s = Math.floor(255 / (Math.pow(2, depth) - 1)), i = s; i < 256; i += s) {
      rawData += conv(i + i * 256 + i * 65536);
    }
  }

  //Pixel rawData
  rawData += String.fromCharCode.apply(String, data);
  // console.log(rawData)
  return rawData;
}

// | Offset | Size | Purpose |
// | 0 | 2  | the header field used to identify the BMP & DIB file is 0x42 0x4D in hexadecimal, same as BM in ASCII. The following entries are possible:

// *   **BM** – Windows 3.1x, 95, NT, ... etc.
// *   **BA** – OS/2 struct Bitmap Array
// *   **CI** – OS/2 struct Color Icon
// *   **CP** – OS/2 const Color Pointer
// *   **IC** – OS/2 struct Icon
// *   **PT** – OS/2 Pointer

//  |
// | 2 | 4  | the size of the BMP file in bytes |
// | 6 | 2  | reserved; actual value depends on the application that creates the image |
// | 8 | 2  | reserved; actual value depends on the application that creates the image |
// | <sub>10</sub> | 4  | the offset, i.e. starting address, of the byte where the bitmap image data (pixel array) can be found. |
//
// | Offset  | Size | Purpose |
// | 14 | 4 | the size of this header (40 bytes) |
// | 18 | 4 | the bitmap width in pixels (signed integer). |
// | 22 | 4 | the bitmap height in pixels (signed integer). |
// | 26 | 2 | the number of color planes being used. Must be set to 1. |
// | 28 | 2 | the number of bits per pixel, which is the color depth of the image. Typical values are 1, 4, 8, 16, 24 and 32. |
// | 30 | 4 | the compression method being used. See the next table for a list of possible values. |
// | 34 | 4 | the image size. This is the size of the raw bitmap data (see below), and should not be confused with the file size. |
// | 38 | 4 | the horizontal resolution of the image. (pixel per meter, signed integer) |
// | 42 | 4 | the vertical resolution of the image. (pixel per meter, signed integer) |
// | 46 | 4 | the number of colors in the color palette, or 0 to default to 2<sup>_n_</sup>. |
// | 50 | 4 | the number of important colors used, or 0 when every color is important; generally ignored. |

function MonochromeBmpFrom2(width, height, data) {

  var offset = 54;
  var totalLength = offset + data.length;

  var rawHeader = Buffer.alloc(offset);
  rawHeader.write('BM');
  rawHeader.writeUInt32LE(offset + data.length, 2); // BMP size
  rawHeader.writeUInt16LE(0, 6); // unused
  rawHeader.writeUInt16LE(0, 8); // unused
  rawHeader.writeUInt32LE(offset, 10); // pixel data offset

  //DIB Header
  rawHeader.writeUInt32LE(40, 14); // DIB header length
  rawHeader.writeUInt32LE(width, 18); // image width
  rawHeader.writeUInt32LE(height, 22); // image height
  rawHeader.writeUInt16LE(1, 26); // colour panes
  rawHeader.writeUInt16LE(8, 28); // bits per pixel
  rawHeader.writeUInt32LE(0, 30); // compression method
  rawHeader.writeUInt32LE(data.length, 34); // size of the raw rawHeader
  rawHeader.writeUInt32LE(2835, 38); // horizontal print resolution
  rawHeader.writeUInt32LE(2835, 42); // vertical print resolution
  rawHeader.writeUInt32LE(0, 46); // colour palette, 0 == 2^n
  rawHeader.writeUInt32LE(0, 50); // important colours

  // console.log(rawData)
  return Buffer.concat([rawHeader, data], totalLength);
}