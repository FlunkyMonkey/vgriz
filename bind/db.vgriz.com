;
; BIND data file for vgriz.com
;
$TTL    604800
@       IN      SOA     ns1.example.com. admin.example.com. (
                              1         ; Serial
                         604800         ; Refresh
                          86400         ; Retry
                        2419200         ; Expire
                         604800 )       ; Negative Cache TTL
;
@       IN      NS      ns1.example.com.
@       IN      NS      ns2.example.com.

ns1     IN      A       172.18.232.10
ns2     IN      A       172.18.5.10

@                   IN  A     10.16.1.5
dc01.ad             IN  A     172.18.232.10
DC02.ad             IN  A     172.18.5.10
AnissaiPad          IN  A     192.168.4.88
AnissaKindle        IN  A     192.168.4.71
AnissaMini          IN  A     192.168.4.56
AnissaPhone         IN  A     192.168.4.67
AnissaWatch         IN  A     192.168.4.53
AnissaWorkLaptop    IN  A     192.168.4.105
AnissaWyzeBulb      IN  A     192.168.4.104
BackyardCam         IN  A     192.168.4.76
basementwap         IN  A     172.18.1.5
BasementWyzeBulb    IN  A     192.168.4.107
comcasthv           IN  A     192.168.100.1
dentv               IN  A     192.168.4.93
denwap              IN  A     172.18.1.4
esx01               IN  A     172.18.1.10
esx01nfs            IN  A     10.30.30.10
esx01vmo            IN  A     10.20.20.10
esx02               IN  A     172.18.1.20
esx02nfs            IN  A     10.30.30.20
esx02vmo            IN  A     10.20.20.20
esx03               IN  A     172.18.1.30
esx03nfs            IN  A     10.30.30.30
esx03vmo            IN  A     10.20.20.30
gamingpc            IN  A     192.168.4.109
GarageCam           IN  A     192.168.4.61
GG2                 IN  A     192.168.4.58
Google-Home         IN  A     192.168.4.55
GoogleNestHub       IN  A     192.168.4.96
IcePhone            IN  A     192.168.4.79
JuneIcePad-Old      IN  A     192.168.4.68
JuneiPad            IN  A     192.168.4.97
JuneRoku            IN  A     192.168.4.66
JunesiPhone         IN  A     192.168.4.65
JuneWyzeBulb        IN  A     192.168.4.102
kube1               IN  A     172.18.232.41
kube2               IN  A     172.18.232.42
kube3               IN  A     172.18.232.43
kubemaster1         IN  A     172.18.232.31
kubemaster2         IN  A     172.18.232.32
kubemaster3         IN  A     172.18.232.33
lb1                 IN  A     172.18.232.28
lb2                 IN  A     172.18.232.29
MasterMini          IN  A     192.168.4.82
MasterTherm         IN  A     192.168.4.62
mbipmi01mgmt        IN  A     172.18.1.11
mbipmi02mgmt        IN  A     172.18.1.21
mblnx03             IN  A     172.18.232.111
MikeKindle          IN  A     192.168.4.75
MikesiPad           IN  A     192.168.4.92
MikesiPhone         IN  A     192.168.4.89
MikeWorkLaptop      IN  A     192.168.4.98
MikeWyzeBulb        IN  A     192.168.4.101
mikrotik            IN  A     172.18.1.13
minecraft           IN  A     192.168.4.11
monitor             IN  A     172.18.1.50
NestCam             IN  A     192.168.4.52
NestConnect         IN  A     192.168.4.59
NestProtect         IN  A     192.168.4.60
NestTherm           IN  A     192.168.4.51
NintendoSwitch      IN  A     192.168.4.108
ntp                 IN  A     172.18.5.10
ntp                 IN  A     172.18.232.10
peakups             IN  A     172.18.1.38
peakups02           IN  A     172.18.1.39
peakups02mgmt       IN  A     172.18.1.39
peakupsmgmt         IN  A     172.18.1.38
pfsense             IN  A     172.18.1.1
pi                  IN  A     10.1.0.2
piaware             IN  A     192.168.4.86
plex03              IN  A     192.168.4.10
printermgmt         IN  A     192.168.4.5
quantum             IN  A     192.168.0.3
quantum             IN  A     192.168.0.1
quinnipad           IN  A     192.168.4.94
QuinnMini           IN  A     192.168.4.83
quinnsipad-old      IN  A     192.168.4.74
QuinnWyzeBulb       IN  A     192.168.4.100
Rachio              IN  A     192.168.4.50
rancher             IN  A     172.18.232.30
RancherFireplaceWyzeBulb IN  A 192.168.4.106
RancherMini         IN  A     192.168.4.54
RancherRoki         IN  A     192.168.4.91
RancherSofaWyzeBulb IN  A     192.168.4.103
rancherwap          IN  A     172.18.1.6
rdp                 IN  A     10.16.1.10
RokuRecRoom         IN  A     192.168.4.85
RokuStick           IN  A     192.168.4.73
sdr                 IN  A     172.18.1.28
SunRoomTV           IN  A     192.168.4.99
sunwap              IN  A     172.18.1.3
TCL-TV              IN  A     192.168.4.70
TrueNAS01           IN  A     172.18.1.96
TrueNAS01-nfs       IN  A     10.30.30.96
TrueNAS02           IN  A     172.18.1.97
TrueNAS02-NFS       IN  A     10.30.30.97
unifi               IN  A     172.18.1.12
unifiswitch         IN  A     172.18.1.7
vcenter             IN  A     172.18.232.230
VLAN101-vmotion     IN  A     10.40.40.1
vlan103-nfs         IN  A     10.30.30.1
vlan161-dmz         IN  A     10.16.1.1
VLAN168-WLAN        IN  A     192.168.4.1
VLAN185-OOB-Web     IN  A     172.18.5.1
web                 IN  A     10.16.1.15
wlan-gateway        IN  A     192.168.1.1
www                 IN  A     10.16.1.5
WyzePlug1           IN  A     192.168.4.80
WyzePlug2           IN  A     192.168.4.81
XPS13               IN  A     192.168.4.64