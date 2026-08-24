pipeline {
    agent any

    triggers {
        githubPush()
    }

    options {
        disableConcurrentBuilds(abortPrevious: true)
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Prepare Env') {
            steps {
                sh 'cp /var/jenkins_home/shared_env/web.env .env'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t bio-clinical-web .'
            }
        }

        stage('Deploy') {
            steps {
                sh 'docker stop bio-clinical-web || true'
                sh 'docker rm bio-clinical-web || true'
                sh 'docker run -d --name bio-clinical-web -p 3000:80 --restart always bio-clinical-web'
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
