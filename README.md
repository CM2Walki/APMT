# ScaleX: Auto-scaling Performance Measurement Tool (Multi-layered Level) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/bca3146fb95f49f4866138b41c1de69b)](https://www.codacy.com?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=ansjin/Multi-Layered-Cloud-Applications-Auto-Scaling-Performance-Analysis&amp;utm_campaign=Badge_Grade) [![Build Status](https://travis-ci.com/ansjin/Multi-Layered-Cloud-Applications-Auto-Scaling-Performance-Analysis.svg?token=Ro5JmNzXybzvxeXtg7cx&branch=master)](https://travis-ci.com/ansjin/Multi-Layered-Cloud-Applications-Auto-Scaling-Performance-Analysis) [![Docker Status](https://github.com/ansjin/Multi-Layered-Cloud-Applications-Auto-Scaling-Performance-Analysis/blob/master/Documents/docker-hub.jpg)](https://hub.docker.com/r/ansjin/multi-layered-cloud-applications-auto-scaling-perormance-analysis/)

[![Scale-XYZ](https://github.com/ansjin/APMT/blob/master/Documents/ScaleXYZ1.png)](https://github.com/ansjin/APMT)

Multi-Layered Cloud Applications Auto-Scaling Performance Analysis

This tool automatically estimates and analyzes different configurations of existing cloud auto-scaling solutions in respect to performance and costs metrics, and presents the user with the best suited configuration for the deployment of their application along with the pros and cons of set configuration.

## Setup
### docker-compose
```bash
$ docker-compose up -d
```

After the building is concluded visit:<br>
http://VM_IP:8080 
 
Ref. Commands: 
```bash
sudo mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
kubectl -n kube-system describe secret $(kubectl -n kube-system get secret | awk '/^deployment-controller-token-/{print $1}') | awk '$1=="token:"{print $2}'

http://YOUR_VM_IP:8001/api/v1/namespaces/kube-system/services/http:kubernetes-dashboard:/proxy/
```

## Usage
Once it starts running then you need to create the account. After login you will be required to insert the following fields:
- AWS Token
- AWS Secret Key
- AWS Key Pair
- AWS Region
- AWS Subnet ID
- AWS Subnet ID 2
- AWS Security Group ID

These fields are required for the interaction between ScaleX and the AWS API. They also act as default values when deploying a new test cluster.

After completing the profile, the next task is to use the application deployment procedure. 
These are of three types: 
- AWS auto-scaling group (VM scaling)
- Kubernetes Horizontal Pod Autoscaler (POD scaling)
- AWS auto-scaling group and Kubernetes Horizontal Pod Autoscaler (VM + POD scaling)


After selecting deploy, there would some fields to be filled.
Once those are filled the deployment will take place.
 
After the deployment is done now the user can generate the load to test the autoscaling deployment.
As part of load generator there are some default load added. 
 
Here is the video to show the usage
(https://s3.amazonaws.com/videoautoscale/apmt.mp4)

## Documentation

Further documentation can be found in the ```docs``` folder

## Help and Contribution

Please open an issue if you have a question or found a problem. 

Pull requests are welcome, too!
