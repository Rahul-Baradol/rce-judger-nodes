import * as fs from "fs";
import { Kafka } from 'kafkajs';
import { exec } from 'child_process';
import connectDB from './middleware/connectdb'
import { exit } from "process";

require('dotenv').config({ path: ".env.local" });

const inputFile = "input.txt";

async function run() {
   try {
      await connectDB();

      const kafka = new Kafka({
         "clientId": "kafka",
         "brokers": [`${process.env.BROKER_URL || "localhost:9092"}`]
      });

      const consumer = kafka.consumer({
         "groupId": "judgernodes"
      });

      console.log("Connecting to the kafka cluster...");
      await consumer.connect();
      console.log("Connected!!");

      await consumer.subscribe({
         "topic": `Submission`,
         "fromBeginning": false
      })

      await consumer.run({
         "eachMessage": async (result: any) => {
            const message = JSON.parse(result.message.value);

            const input = `3
            0 1
            1 2
            0 1`;

            const expectedOutput = `0 1\n1 2\n0 1\n`;
            
            fs.writeFileSync(`${__dirname}/cpp/input.txt`, input, {
               encoding: "utf-8"
            });

            fs.writeFileSync(`${__dirname}/cpp/code.cpp`, message.code, {
               encoding: "utf-8"
            });
            
            exec(`${__dirname}/cpp/cpp.sh 2 1000000`, (error, outputContent, stderr) => {
               if (error) {
                  console.log("Could not execute the script");
                  console.log(error);
                  return;
               }

               if (stderr) {
                  if (stderr === "CE\n" || stderr === "RE\n") {
                     console.log(stderr);
                     console.log(outputContent);
                  } else {
                     console.log(stderr);
                  }
               } else if (expectedOutput === outputContent) {
                  console.log('AC');
               } else {
                  console.log('WA');
               }
            });

            // exec(`g++ ${__dirname}/code.cpp`, async (err, stdout, stderr) => {
            //    if (err) {
            //       // Compilation Error
            //       const newSubmission = new submissionSchema({
            //          submissionId: message.submissionId,
            //          user: message.userEmail,
            //          problemId: message.problemId,
            //          code: message.code,
            //          status: "CE",
            //          time: message.time
            //       });

            //       await newSubmission.save();

            //       await systemDataSchema.findOneAndUpdate(
            //          {
            //             title: "submissions"
            //          },

            //          {
            //             $inc: {
            //                nextSubmissionId: 1
            //             }
            //          });
            //       return;
            //    }

            //    let verdict = null;
            //    let timeout = false;
            //    let runtimeError = false;

            //    let programOutput = "";

            //    let process = exec(`${__dirname}/a.exe`, {
            //       input: fs.createReadStream(inputFile),
            //       encoding: 'utf8'
            //    }, async (error, stdout, stderr) => {
            //       if (error) {
            //          runtimeError = true;
            //          return;
            //       }

            //       programOutput = stdout;
            //    });

            //    let timerId = setTimeout(() => {
            //       process.kill();
            //       timeout = true;
            //    }, message.timeLimit)

            //    process.on('exit', async (exitCode) => {
            //       clearTimeout(timerId);
            //       if (runtimeError) {
            //          verdict = "RE";
            //       } else if (timeout) {
            //          verdict = "TLE";
            //       } else if (programOutput === message.expectedOutput) {
            //          verdict = "AC";
            //       } else {
            //          verdict = "WA";
            //       }

            //       const newSubmission = new submissionSchema({
            //          submissionId: message.submissionId,
            //          user: message.userEmail,
            //          problemId: message.problemId,
            //          code: message.code,
            //          status: verdict,
            //          time: message.time
            //       })

            //       await newSubmission.save();

            //       await systemDataSchema.findOneAndUpdate({
            //          title: "submissions"
            //       },
            //          {
            //             $inc: {
            //                nextSubmissionId: 1
            //             }
            //          });
            //    })
            // });
         }
      });
   } catch (error) {
      console.log("CPP Judge Node Crashed.");
      console.log(error);
      exit(1);
   }
}

run();