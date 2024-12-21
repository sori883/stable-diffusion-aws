import boto3
import json
import os
import threading

import requests
from nacl.signing import VerifyKey

DISCORD_ENDPOINT = "https://discord.com/api/v10"

DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")
APPLICATION_ID = os.getenv("APPLICATION_ID")
APPLICATION_PUBLIC_KEY = os.getenv("APPLICATION_PUBLIC_KEY")
COMMAND_GUILD_ID = os.getenv("COMMAND_GUILD_ID")
INSTANCE_ID = os.getenv("INSTANCE_ID")

verify_key = VerifyKey(bytes.fromhex(APPLICATION_PUBLIC_KEY))

def registerCommands():
    endpoint = f"{DISCORD_ENDPOINT}/applications/{APPLICATION_ID}/guilds/{COMMAND_GUILD_ID}/commands"
    print(f"registering commands: {endpoint}")

    commands = [
        {
            "name": "start_sb",
            "description": "Start Stable Diffusion Instance",
        },
        {
            "name": "stop_sb",
            "description": "Stop Stable Diffusion Instance",
        },
        {
            "name": "get_address",
            "description": "Get Stable Diffusion Address",
        }
    ]

    headers = {
        "User-Agent": "discord-slash-commands-helloworld",
        "Content-Type": "application/json",
        "Authorization": f"Bot {DISCORD_TOKEN}"
    }

    for c in commands:
        requests.post(endpoint, headers=headers, json=c).raise_for_status()

def verify(signature: str, timestamp: str, body: str) -> bool:
    try:
        verify_key.verify(f"{timestamp}{body}".encode(), bytes.fromhex(signature))
    except Exception as e:
        print(f"failed to verify request: {e}")
        return False

    return True

def start_handler():
    ec2 = boto3.client("ec2")
    ec2resource = boto3.resource("ec2").Instance(INSTANCE_ID)

    # only running instance will return
    description = ec2.describe_instance_status(
        InstanceIds=[INSTANCE_ID],
        IncludeAllInstances=True
    )
    instance_state = description["InstanceStatuses"][0]["InstanceState"]["Name"]

    # インスタンスが停止以外のステータスだった場合のリターン
    if instance_state != "stopped":
        return "インスタンスは既に起動しています。"

    # インスタンスの起動
    ec2resource.start()
    return "インスタンスを起動します。"


def stop_handler():
    ec2 = boto3.client("ec2")
    description = ec2.describe_instance_status(
        InstanceIds=[INSTANCE_ID],
        IncludeAllInstances=True
    )
    instance_state = description["InstanceStatuses"][0]["InstanceState"]["Name"]
    if instance_state == "stopped":
        return "インスタンスは既に停止しています。"
    ec2.stop_instances(InstanceIds=[INSTANCE_ID])
    return "インスタンスを停止します。"

def get_address():
    ec2 = boto3.client("ec2")
    ec2resource = boto3.resource("ec2").Instance(INSTANCE_ID)

    description = ec2.describe_instance_status(
        InstanceIds=[INSTANCE_ID],
        IncludeAllInstances=True
    )
    instance_state = description["InstanceStatuses"][0]["InstanceState"]["Name"]
    if instance_state == "stopped":
        return "インスタンスは停止状態です。"
    return f"http://{ec2resource.public_ip_address}:7860/"


def callback(event: dict, context: dict):
    # API Gateway has weird case conversion, so we need to make them lowercase.
    # See https://github.com/aws/aws-sam-cli/issues/1860
    headers: dict = { k.lower(): v for k, v in event["headers"].items() }
    rawBody: str = event["body"]

    # validate request
    signature = headers.get("x-signature-ed25519")
    timestamp = headers.get("x-signature-timestamp")

    if not verify(signature, timestamp, rawBody):
        return {
            "cookies": [],
            "isBase64Encoded": False,
            "statusCode": 403,
            "headers": {},
            "body": ""
        }
    
    req: dict = json.loads(rawBody)
    if req["type"] == 1: # InteractionType.Ping
        registerCommands()
        return {
            "type": 1 # InteractionResponseType.Pong
        }
    elif req["type"] == 2: # InteractionType.ApplicationCommand
        command_name = req["data"]["name"]
        
        # Prepare a default response
        response_text = "Unknown command."
        client = boto3.client("lambda")

        if command_name == "start_sb":
            response_text = start_handler()
            # Add your logic to start the Stable Diffusion instance here
        elif command_name == "stop_sb":
            # Logic for StopSB command
            response_text = stop_handler()
            # Add your logic to stop the Stable Diffusion instance here
        elif command_name == "get_address":
            response_text = get_address()

        return {
            "type": 4, # InteractionResponseType.ChannelMessageWithSource
            "data": {
                "content": response_text
            }
        }
