#!/usr/bin/env node
const mysql = require('mysql');
const yargs = require('yargs');
const chalk = require('chalk');
const boxen = require('boxen');
const figlet = require('figlet');
const { exec } = require('child_process');
const util = require('util');

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "saksri@25",
    database: "userdata"
});

console.log("\nUsage: processcli <--user> <--password> [--listprocesses] [--kill all] [--kill browser]\n" +
  boxen(chalk.green('\n' + 'Lists the currently running processes and optionally kills processes according to choice' + '\n'), {
    padding: 1,
    borderColor: 'green',
    dimBorder: true,
  }) +
  '\n'
);
 
const argv = require('yargs/yargs')(process.argv.slice(2)).argv;

const options = yargs
.option('user',{
    describe: 'username',
    type: 'string',
    demandOption: true
})
.option('pwd',{
    describe: 'password',
    type: 'string',
    demandOption: true
})
.option('listprocesses', {
    describe: 'List running processes',
    type: 'boolean',
    demandOption: false,
  })
  .option('kill', {
    describe: 'Kill processes by name',
    type: 'string',
    demandOption: false,
  })
  .help(true)
  .argv;

var username = argv.user;
var pwd = argv.pwd;
var res = null;

function retrievepasswordfromdb(username, pwd){
return new Promise((resolve, reject) => {
con.connect(function(err) {
    console.log("Connected!");
    var sql = `select pwd from userdetails where username = '${username}'`;
    var res;
    con.query(sql,function(err, result){
        if(err){
            console.log("Login failed");
            reject();
        }
        else{
            res = result[0].pwd;
            console.log("Password from db: "+res);
            if(res === pwd){
                console.log("login success");
                resolve();
            }
            else{
                console.log("login failed")
                reject();
            }
        }
    })
  });
 })
}

retrievepasswordfromdb(username,pwd)
.then(runcli =>{
    const execPromise = util.promisify(exec);
    if (argv.listprocesses) {
        execPromise('tasklist')
          .then(({ stdout }) => {
            const processes = stdout.split('\n').slice(3).map((line) => line.split(/\s+/)[0]);
            console.log(
              '\n' +
                boxen(chalk.green('Running Processes:\n\n' + processes.join('\n')), {
                  padding: 1,
                  borderColor: 'green',
                  dimBorder: true,
                }) +
                '\n'
            );
          })
          .catch((error) => {
            console.error(error);
          });
        }
        
        if (argv.kill === 'all') {
        execPromise('taskkill /F /FI "STATUS eq running"')
          .then(() => {
            console.log('Successfully killed all running processes');
          })
          .catch((error) => {
            console.error(`Error killing processes: ${error}`);
          });
        }
        
        if (argv.kill === 'browser') {
        const browserProcesses = ['chrome.exe', 'firefox.exe', 'msedge.exe', 'brave.exe'];
        const pName = browserProcesses.map((processName) => `IMAGENAME eq ${processName}`).join(' || ');
        execPromise(`taskkill /F /FI "${pName}"`)
          .then(() => {
            console.log('Successfully killed browser processes');
          })
          .catch((error) => {
            console.error(`Error killing processes: ${error}`);
          });
        }
})

.catch((error) =>{
    console.log("Login failed");
})



