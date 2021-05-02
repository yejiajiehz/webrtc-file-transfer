env.DIND_PROJECT_LABEL_DEDICATED="frontend"
 // 钉钉群机器人 access-token
env.DIND_NOTIFY_DINGTALK_ACCESS_TOKEN = "__TOKEN__";

pipelineDefault.run({
    withEnv([
        'CDN_URL=https://cdn.dancf.com'
    ]){
        withCredentials([
            string(credentialsId: 'OSS_ACCESS_KEY', variable: 'OSS_ACCESS_KEY'),
            string(credentialsId: 'OSS_SECRET_KEY', variable: 'OSS_SECRET_KEY'),
            string(credentialsId: 'OSS_BUCKET', variable: 'OSS_BUCKET'),
            string(credentialsId: 'OSS_REGION', variable: 'OSS_REGION'),
            string(credentialsId: 'GAODING_NPM_TOKEN', variable: 'GAODING_NPM_TOKEN'),
            string(credentialsId: 'GAODING_GITHUB_TOKEN', variable: 'GH_TOKEN'),
            string(credentialsId: 'APOLLO_GAODINGX_TOEKN', variable: 'APOLLO_GAODINGX_TOEKN'),
            string(credentialsId: 'APOLLO_GAODINGX_USER_ID', variable: 'APOLLO_GAODINGX_USER_ID')
        ]) {
            // 构建，资源上传CDN
            stage('Build') {
                when(['dev', 'fat', 'stage', 'prod', 'private'].contains(env.DIND_RUNTIME_ENV_NAME)){
                    sh '''
                        npm i
                        npm run build
                        dind-cicd-tool cdn
                    '''
                }
            }
            // dev 部署 apollo
            stage('Deploy-Dev') {
                when(['dev', 'fat'].contains(env.DIND_RUNTIME_ENV_NAME)) {
                    sh '''
                        dind-cicd-tool apollo
                    '''
                }
            }
            // 其余环境部署 drms
            stage('Deploy-DRMS') {
                when(['fat', 'stage', 'prod'].contains(env.DIND_RUNTIME_ENV_NAME)){
                    sh '''
                        dind-cicd-tool drms
                    '''
                }
            }
            // 私有环境打包 zip 上传 CDN
            stage('Deploy-Private') {
                when(['private'].contains(env.DIND_RUNTIME_ENV_NAME)) {
                    sh '''
                        dind-cicd-tool zip
                        dind-cicd-tool cdn -tag zip
                    '''
                }
            }
            // 钉钉通知
            stage('Notify') {
                when(['dev', 'fat', 'stage', 'prod', 'private'].contains(env.DIND_RUNTIME_ENV_NAME)){
                    sh '''
                        dind-cicd-tool dingtalk
                    '''
                }
            }
        }
    }
});
