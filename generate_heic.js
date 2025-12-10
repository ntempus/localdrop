const fs = require('fs');
const path = require('path');

const createDummyHeic = (filename) => {
    const buffer = Buffer.alloc(1024); // 1KB
    // ftyp at 4
    buffer.write('ftyp', 4);
    // brand at 8
    buffer.write('heic', 8);

    const filePath = path.join(process.cwd(), filename);
    fs.writeFileSync(filePath, buffer);
    console.log(`Created ${filePath}`);
};

createDummyHeic('test1.heic');
createDummyHeic('test2.heic');
