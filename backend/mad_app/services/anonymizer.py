import random
import secrets

ANIMALS = [
    "Fox", "Owl", "Bear", "Wolf", "Deer", "Hawk", "Lynx", "Seal",
    "Otter", "Panda", "Koala", "Falcon", "Eagle", "Tiger", "Lion",
    "Cheetah", "Panther", "Jaguar", "Leopard", "Dolphin", "Whale",
    "Penguin", "Raven", "Crow", "Badger", "Hedgehog", "Squirrel",
    "Beaver", "Bison", "Elk", "Moose", "Heron", "Crane", "Robin"
]

def generate_display_name() -> str:
    animal = random.choice(ANIMALS)
    num = random.randint(100, 999)
    return f"{animal}_{num}"

def generate_avatar_seed() -> str:
    return secrets.token_hex(8)
