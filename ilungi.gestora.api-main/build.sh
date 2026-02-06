#!/bin/bash
# build.sh
apt-get update
apt-get install -y openjdk-17-jdk
export JAVA_HOME=/usr/lib/jvm/java-25-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH
./gradlew build