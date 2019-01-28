#!/bin/bash
$(aws ecr get-login --no-include-email --region us-west-2)
docker build -t miramenu-b2c-server .
docker tag miramenu-b2c-server:latest 780139254791.dkr.ecr.us-west-2.amazonaws.com/miramenu-b2c-server:latest
docker push 780139254791.dkr.ecr.us-west-2.amazonaws.com/miramenu-b2c-server:latest

#deploy
#echo 'update task definition...'
#aws ecs register-task-definition --cli-input-json file://$taskDefinitionFile --region us-west-2

echo 'update our service with that last task..'
aws ecs update-service --cluster miramenu-b2c-server --service b2c-server --task-definition miramenu-b2c-server --force-new-deployment --region us-west-2

echo '(for development only) Replace to new Task..'
TASK_ID=$(aws ecs list-tasks --cluster miramenu-b2c-server | grep 'arn:' | sed 's/\"//g' | sed 's/^.*arn/arn/')
if [ "$TASK_ID" != "" ]; then
  aws ecs stop-task --cluster miramenu-b2c-server --task $TASK_ID --reason 'auto deploy'
else
  echo 'no task to stop'
fi