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
sudo journalctl -f -u keepalived