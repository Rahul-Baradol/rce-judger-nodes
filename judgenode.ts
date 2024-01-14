import * as fs from "fs";
import { Kafka } from 'kafkajs';
import { exec } from 'child_process';
import connectDB from './middleware/connectdb'
import { exit } from "process";
import submissionModel from './models/submission';
import systemDataModel from './models/systemData';

require('dotenv').config({ path: ".env.local" });

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
            
            const submissionId = message.submissionId;
            const problemTitle = message.problemTitle;
            const userEmail = message.userEmail;
            const time = message.time;

            const logicCode = message.code;
            const lang = message.lang;
            const input = message.input;
            const expectedOutput = message.expectedOutput;

            const driverHead = message.driverHead;
            const driverMain = message.driverMain;

            const timeLimit = message.timeLimit_sec;
            const memoryLimit = message.memoryLimit_kb;

            if (!(driverHead && logicCode && driverMain)) {
               console.log("Code not complete");
               return;
            }

            const code = driverHead + logicCode + driverMain;

            fs.writeFileSync(`${__dirname}/runners/input.txt`, input, {
               encoding: "utf-8"
            });

            fs.writeFileSync(`${__dirname}/runners/code.${lang}`, code, {
               encoding: "utf-8"
            });

            exec(`${__dirname}/runners/${lang}.sh ${timeLimit} ${memoryLimit}`, async (error, outputContent, stderr) => {
               if (error) {
                  console.log("Could not execute the script");
                  console.log(error);
                  return;
               }

               if (stderr) {
                  if (stderr === "CE\n" || stderr === "RE\n") {
                     const newSubmission = new submissionModel({
                        submissionId: submissionId,
                        user: userEmail,
                        problemTitle: problemTitle,
                        code: logicCode,
                        status: `${stderr === "CE\n" ? "CE" : "RE"}`,
                        message: `${outputContent}`,
                        time: time
                     });

                     await newSubmission.save();

                     await systemDataModel.findOneAndUpdate(
                     {
                        title: "submissions"
                     },

                     {
                        $inc: {
                           nextSubmissionId: 1
                        }
                     });
                  } else {
                     const newSubmission = new submissionModel({
                        submissionId: submissionId,
                        user: userEmail,
                        problemTitle: problemTitle,
                        code: logicCode,
                        status: `${stderr === "TLE\n" ? "TLE" : "MLE"}`,
                        time: time
                     });

                     await newSubmission.save();

                     await systemDataModel.findOneAndUpdate(
                     {
                        title: "submissions"
                     },

                     {
                        $inc: {
                           nextSubmissionId: 1
                        }
                     });
                  }
               } else if (expectedOutput === outputContent) {
                  const newSubmission = new submissionModel({
                     submissionId: submissionId,
                     user: userEmail,
                     problemTitle: problemTitle,
                     code: logicCode,
                     status: `AC`,
                     time: time
                  });

                  await newSubmission.save();

                  await systemDataModel.findOneAndUpdate(
                  {
                     title: "submissions"
                  },

                  {
                     $inc: {
                        nextSubmissionId: 1
                     }
                  });
               } else {
                  const newSubmission = new submissionModel({
                     submissionId: submissionId,
                     user: userEmail,
                     problemTitle: problemTitle,
                     code: logicCode,
                     status: `WA`,
                     time: time
                  });

                  await newSubmission.save();

                  await systemDataModel.findOneAndUpdate(
                  {
                     title: "submissions"
                  },

                  {
                     $inc: {
                        nextSubmissionId: 1
                     }
                  });
               }
            });
         }
      });
   } catch (error) {
      console.log("CPP Judge Node Crashed.");
      console.log(error);
      exit(1);
   }
}

run();