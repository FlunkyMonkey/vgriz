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