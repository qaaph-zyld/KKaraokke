import requests

url = "http://127.0.0.1:5000/api/sync"
files = {'audio': open('Little_planet.wav', 'rb')}
data = {'lyrics': open('Little_plannet.md', 'r').read()}

print("Sending request...")
response = requests.post(url, files=files, data=data)
print("Status code:", response.status_code)
if response.status_code == 200:
    print("Success! Lyrics:")
    print(response.json()['synced_lyrics'][:500])
else:
    print("Error:", response.text)
