@echo off

REM ***************************************************************************
REM ********* This assumes that Node.js and MongoDB are in your path! *********
REM ***************************************************************************

cls

start mongo ds031567.mongolab.com:31567/ebooking_db -u admin -p seng299
node.exe main.js
