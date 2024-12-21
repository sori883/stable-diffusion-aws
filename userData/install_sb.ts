import { nodeEnv } from "~/env";

export const installSb = `#!/bin/bash

sudo apt-get remove unattended-upgrades -y

sudo apt update
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt -y install wget git 
sudo apt -y install python3 python-is-python3 python3-pip python3-venv
sudo apt -y install python3.10 python3.10-distutils python3.10-venv python3.10-tk
curl -sS https://bootstrap.pypa.io/get-pip.py | sudo python3.10
python3.10 -m pip install --upgrade pip
sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.10 1

cd /home/ubuntu

curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
sudo ./aws/install --update
rm awscliv2.zip
rm -Rf aws

sudo -u ubuntu git clone https://github.com/lllyasviel/stable-diffusion-webui-forge.git

cat > /etc/systemd/system/sd-webui.service <<EOF
[Unit]
Description=SD WebUI Service
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu
ExecStart=/bin/bash -c 'stable-diffusion-webui-forge/webui.sh --xformers --listen --enable-insecure-extension-access --gradio-auth ${nodeEnv.SB_USERNAME}:${nodeEnv.SB_PASSWORD} --gradio-queue &> sd-webui-log.txt'
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

systemctl enable sd-webui
systemctl start sd-webui
`;