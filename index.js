const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const child = Promise.promisifyAll(require('child_process'))

const initSigner = callback => {
  // generate ec key
  let cmd1 = 'openssl ecparam -name prime256v1 -genkey'
  child.exec(cmd1, (err, privateKey) => {
    if (err) return callback(err)
    // generate self-signed certificate
    let cmd2 = `openssl req -new -x509 -nodes`
      + ` -key <(echo "${privateKey}")`
      + ` -subj "/O=WST/CN=WST Signer"`
      + ` -days 11499`

    child.exec(cmd2, { shell: '/bin/bash' }, (err, certificate) => err
      ? callback(err)
      : callback(null, { privateKey, certificate }))
  })
}

const initSignerAsync = Promise.promisify(initSigner)

const extfile = '[ids]\n' +
  'subjectKeyIdentifier=hash\n' +
  'authorityKeyIdentifier=keyid\n'


const signCsr = (csr, ca, key, serial, callback) => {
  const cmd = `openssl x509 -req` +
    ` -in <(echo -e "${csr}")` +
    ` -CA <(echo -e "${ca}")` +
    ` -CAkey <(echo -e "${key}")` +
    ` -set_serial 1234567890` + 
    ` -extensions ids` +
    ` -extfile <(echo -e "${extfile}")` +
    ` -days 11499`

  child.exec(cmd, { shell: '/bin/bash' }, callback)
}

const signCsrAsync = Promise.promisify(signCsr)

initSigner((err, signer) => {
  if (err) return console.log(err)

//  fs.writeFileSync('signer-cert.pem', signer.certificate)
//  fs.writeFileSync('signer-key.pem', signer.privateKey)
//  fs.writeFileSync('extfile.tmp', extfile)

  console.log(signer)

  signCsr(fs.readFileSync('device.csr'), 
    signer.certificate, 
    signer.privateKey, 
    123, 
    (err, deviceCert) => {
      console.log(err)
      console.log('done')
      console.log(err, deviceCert)
      fs.writeFileSync('deviceCert.pem', deviceCert)
    })
  }) 


