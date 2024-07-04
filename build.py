https://kifarunix.com/setup-highly-available-kubernetes-cluster-with-haproxy-and-keepalived/

#Install keepalived
apt -y install keepalived

#Install HAProxy
apt install haproxy -y

#Modify keepalived file
nano /etc/keepalived/keepalived.conf

#bring up keepalived
sudo systemctl enable --now keepalived

#check IP
ip -br a

#check logs
sudo journalctl -f -u keepalived

#load haproxy config
nano /etc/haproxy/haproxy.cfg

#check config
sudo haproxy -f /etc/haproxy/haproxy.cfg -c -V

#Update HAProxy file descriptor (FD)/open files (NOFILE) limit (done system wide);
echo "fs.nr_open = 1048599" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

#start and enable haproxy
sudo systemctl enable --now haproxy

#disable swap on kubernetes cluster nodes
sudo swapoff -a #Only did Master
sudo sed -i '/swap/s/^/#/' /etc/fstab

#Enable Kernel IP forwarding on Cluster Nodes
echo "net.ipv4.ip_forward=1" | sudo tee -a  /etc/sysctl.conf
sudo sysctl -p

#Load Some Required Kernel Modules on Cluster Nodes
echo 'overlay
br_netfilter' | sudo tee /etc/modules-load.d/kubernetes.conf
sudo modprobe overlay
sudo modprobe br_netfilter
sudo lsmod | grep -E "overlay|br_netfilter"
sudo tee -a /etc/sysctl.conf << 'EOL'
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
EOL
sudo sysctl -p

#Install Container Runtime on Cluster Nodes
sudo apt install apt-transport-https \
	ca-certificates curl \
	gnupg-agent \
	software-properties-common

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/docker.gpg

echo "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -sc) stable" | sudo tee /etc/apt/sources.list.d/docker-ce.list

sudo apt update

sudo apt install -y containerd.io

#Configure Cgroup Driver for ContainerD
[ -d /etc/containerd ] || sudo mkdir /etc/containerd
containerd config default | sudo tee /etc/containerd/config.toml
sudo sed -i '/SystemdCgroup/s/false/true/' /etc/containerd/config.toml

sudo sed -i '/pause:3.8/s/3.8/3.9/' /etc/containerd/config.toml
grep sandbox_image /etc/containerd/config.toml
sudo systemctl enable --now containerd
systemctl status containerd