$(aws ecr get-login --no-include-email --region us-west-2)
docker build -t miramenu-b2c-server .
docker tag miramenu-b2c-server:latest 780139254791.dkr.ecr.us-west-2.amazonaws.com/miramenu-b2c-server:latest
docker push 780139254791.dkr.ecr.us-west-2.amazonaws.com/miramenu-b2c-server:latest