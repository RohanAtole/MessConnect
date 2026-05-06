#!/usr/bin/env sh
set -eu

BASE_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
DIST_DIR="$BASE_DIR/.mvn/wrapper/dists"
MAVEN_VERSION="3.9.9"
MAVEN_HOME="$DIST_DIR/apache-maven-$MAVEN_VERSION"
MAVEN_ZIP="$DIST_DIR/apache-maven-$MAVEN_VERSION-bin.zip"
MAVEN_URL="https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/$MAVEN_VERSION/apache-maven-$MAVEN_VERSION-bin.zip"
MAVEN_REPO="$BASE_DIR/.m2/repository"

mkdir -p "$DIST_DIR"
mkdir -p "$MAVEN_REPO"

if [ ! -x "$MAVEN_HOME/bin/mvn" ]; then
    echo "Downloading Apache Maven $MAVEN_VERSION..."
    if command -v curl >/dev/null 2>&1; then
        curl -fsSL "$MAVEN_URL" -o "$MAVEN_ZIP"
    elif command -v wget >/dev/null 2>&1; then
        wget -q "$MAVEN_URL" -O "$MAVEN_ZIP"
    else
        echo "curl or wget is required to download Maven." >&2
        exit 1
    fi

    echo "Extracting Maven..."
    if command -v unzip >/dev/null 2>&1; then
        unzip -q -o "$MAVEN_ZIP" -d "$DIST_DIR"
    else
        echo "unzip is required to extract Maven." >&2
        exit 1
    fi
fi

exec "$MAVEN_HOME/bin/mvn" "-Dmaven.repo.local=$MAVEN_REPO" "$@"
