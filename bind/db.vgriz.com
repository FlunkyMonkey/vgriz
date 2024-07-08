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

@       IN      A       1.1.1.1
www     IN      A       1.1.1.1
test     IN      A       172.18.232.20
