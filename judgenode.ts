import fs from "fs";
import { Kafka } from 'kafkajs';
import { exec, spawn } from 'child_process';
import connectDB from './middleware/connectdb'
import submissionSchema from './models/submission';
import systemDataSchema from './models/systemData';

require('dotenv').config({ path: ".env.local" });

async function run() {
   try {
      await connectDB();

      const kafka = new Kafka({
         "clientId": "kafka",
         "brokers": [`${process.env.BROKER_URL}`]
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
            const lang = result.partition;
            const message = JSON.parse(result.message.value);

            fs.writeFileSync(`${__dirname}/cpp/code.cpp`, message.code);

            exec(`g++ ${__dirname}/cpp/code.cpp`, async (err, stdout, stderr) => {
               if (err) {
                  // Compile Error
                  const newSubmission = new submissionSchema({
                     submissionId: message.submissionId,
                     user: message.userEmail,
                     problemId: message.problemId,
                     code: message.code,
                     status: "CE",
                     time: message.time
                  })

                  await newSubmission.save();
          
                  await systemDataSchema.findOneAndUpdate({
                     title: "submissions"
                  }, 
                  
                  {
                     $inc: {
                        nextSubmissionId: 1
                     }
                  });
                  return;
               }

               if (stderr) {
                  console.log("stderr");

                  // Runtime Error
                  const newSubmission = new submissionSchema({
                     submissionId: message.submissionId,
                     user: message.userEmail,
                     problemId: message.problemId,
                     code: message.code,
                     status: "RE",
                     time: message.time
                  })

                  await newSubmission.save();
          
                  await systemDataSchema.findOneAndUpdate({
                     title: "submissions"
                  }, 
                  
                  {
                     $inc: {
                        nextSubmissionId: 1
                     }
                  });

                  return;
               }

               const childProcess = spawn(`${__dirname}/a.exe`);

               let verdict = "";
               
               childProcess.stdout.on('data', (data) => {
                  console.log(`Output: ${data}`);

                  if (data == "4") {
                     verdict = "AC";
                  } else {
                     verdict = "WA";
                  }
               });

               childProcess.stderr.on('data', async (data) => {
                  console.error(`Error: ${data}`);
                  
                  // Runtime Error
                  const newSubmission = new submissionSchema({
                     submissionId: message.submissionId,
                     user: message.userEmail,
                     problemId: message.problemId,
                     code: message.code,
                     status: "RE",
                     time: message.time
                  })

                  await newSubmission.save();
          
                  await systemDataSchema.findOneAndUpdate({
                     title: "submissions"
                  }, 
                  
                  {
                     $inc: {
                        nextSubmissionId: 1
                     }
                  });
               });
 
               childProcess.on('close', async (code) => {
                  const newSubmission = new submissionSchema({
                     submissionId: message.submissionId,
                     user: message.userEmail,
                     problemId: message.problemId,
                     code: message.code,
                     status: verdict,
                     time: message.time
                  })

                  await newSubmission.save();
          
                  await systemDataSchema.findOneAndUpdate({
                     title: "submissions"
                  }, 
                  
                  {
                     $inc: {
                        nextSubmissionId: 1
                     }
                  });
                  console.log(`Child process exited with code ${code}`);
               });
            })
         }
      })
   } catch (error) {
      console.log("Something went wrong.");
      console.log(error);
   }
}

run();