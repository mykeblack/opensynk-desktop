from typing import Any
import hashlib
import hmac
import json
import time
import uuid

import requests
import urllib3


class SunsynkClient:
   def __init__(
    self,
    base_url: str,
    access_token: str,
    verify_ssl: bool = True,
    app_key: str = "",
    app_secret: str = "",
    username: str = "",
    password: str = "",
):
    self.base_url = base_url.rstrip("/")
    self.access_token = access_token
    self.verify_ssl = verify_ssl
    self.app_key = app_key
    self.app_secret = app_secret
    self.username = username
    self.password = password

    if not self.verify_ssl:
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        
    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }

    def test_connection(self) -> dict[str, Any]:
        url = self.base_url

        try:
            response = requests.get(
                url,
                timeout=10,
                verify=self.verify_ssl,
            )

            return {
                "success": True,
                "message": f"Host reachable, status {response.status_code}",
                "url": response.url,
                "response_text": response.text[:300],
            }
        except Exception as ex:
            return {
                "success": False,
                "message": str(ex),
                "url": url,
            }

    def get_sites(self) -> list[dict[str, Any]]:
        response = requests.get(
            f"{self.base_url}/api/v1/sites",
            headers=self._headers(),
            timeout=10,
            verify=self.verify_ssl,
        )

        response.raise_for_status()

        data = response.json()
        return data if isinstance(data, list) else []

    def request_access_token(self) -> dict[str, Any]:
        url_path = "/oauth/token"
        url = f"{self.base_url}{url_path}"

        nonce = str(uuid.uuid4())
        timestamp = str(int(time.time() * 1000))

        body = {
            "username": self.username,
            "password": self.password,
            "grant_type": "password",
        }

        body_json = json.dumps(body, separators=(",", ":"))

        string_to_sign = (
            f"POST\n"
            f"application/json\n"
            f"{hashlib.sha256(body_json.encode()).hexdigest()}\n"
            f"{url_path}"
        )

        signature = hmac.new(
            self.app_secret.encode(),
            string_to_sign.encode(),
            hashlib.sha256,
        ).hexdigest().upper()

        headers = {
            "Content-Type": "application/json",
            "X-Ca-Key": self.app_key,
            "X-Ca-Nonce": nonce,
            "X-Ca-Timestamp": timestamp,
            "X-Ca-Signature": signature,
            "X-Ca-Signature-Headers": "X-Ca-Key,X-Ca-Nonce,X-Ca-Timestamp",
        }

        try:
            response = requests.post(
                url,
                headers=headers,
                data=body_json,
                timeout=15,
                verify=self.verify_ssl,
            )

            try:
                response_json = response.json()
            except Exception:
                response_json = None

            return {
                "success": response.status_code < 400,
                "status_code": response.status_code,
                "url": response.url,
                "response_json": response_json,
                "response_text": response.text[:2000],
            }
        except Exception as ex:
            return {
                "success": False,
                "message": str(ex),
                "url": url,
            }