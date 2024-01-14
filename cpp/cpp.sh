#!/bin/sh

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <timeout_duration> <memory_limit>"
    exit 1
fi

timeout_duration=$1
memory_limit=$2

g++ -o ./cpp/output.out ./cpp/code.cpp 2> ./cpp/log.txt

# Check if compilation was successful
if [ $? -eq 0 ]; then
    ulimit -v  "${memory_limit}"
    timeout "${timeout_duration}" ./cpp/output.out < ./cpp/input.txt 1> ./cpp/program_output.txt 2> ./cpp/log.txt

    exit_status=$?

    if [ $exit_status -eq 0 ]; then
        cat ./cpp/program_output.txt 1>&1
        exit 0 
    fi

    # Exit code returned when TLE occurs is 124 by timeout command =>
    # => which makes the OS to return the exit code 143 to the container which is SIGTERM
    if [ $exit_status -eq 143 ]; then
        echo "TLE" 1>&2
        exit 0 # Exiting with exit code 0 so that container doesn't crash
    fi

    if [ $exit_status -eq 139 ]; then
        echo "MLE" 1>&2
        exit 0 # Exiting with exit code 0 so that container doesn't crash
    fi

    echo "RE" 1>&2
    cat ./cpp/log.txt 1>&1
else
    echo "CE" 1>&2
    cat ./cpp/log.txt 1>&1
fi