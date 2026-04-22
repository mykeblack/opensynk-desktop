from typing import Any
import base64
import hashlib
import hmac
import json
import requests
import urllib3
import uuid


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
        self.oauth_base_url = (base_url or "https://openapi.sunsynk.net").rstrip("/")
        self.data_base_url = "https://pv.inteless.com"
        self.access_token = access_token
        self.verify_ssl = verify_ssl
        self.app_key = app_key
        self.app_secret = app_secret
        self.username = username
        self.password = password

        if not self.verify_ssl:
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    def request_access_token(self) -> dict[str, Any]:
        url = f"{self.oauth_base_url}/oauth/token"

        nonce = str(uuid.uuid4())

        body = {
            "username": self.username,
            "password": self.password,
            "grant_type": "password",
            "client_id": "openapi",
        }

        body_json = json.dumps(body, separators=(",", ":"))

        md5_digest = hashlib.md5(body_json.encode("utf-8")).digest()
        content_md5 = base64.b64encode(md5_digest).decode("utf-8")

        headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "Content-MD5": content_md5,
            "X-Ca-Nonce": nonce,
            "X-Ca-Key": self.app_key,
        }

        headers_to_sign = {
            "x-ca-key": self.app_key,
            "x-ca-nonce": nonce,
        }
        sorted_header_keys = sorted(headers_to_sign.keys())
        signature_headers = ",".join(sorted_header_keys)

        text_to_sign = ""
        text_to_sign += "POST\n"
        text_to_sign += "application/json\n"
        text_to_sign += content_md5 + "\n"
        text_to_sign += "application/json\n"
        text_to_sign += "\n"

        for key in sorted_header_keys:
            text_to_sign += f"{key}:{headers_to_sign[key]}\n"

        text_to_sign += url_path

        signature_digest = hmac.new(
            self.app_secret.encode("utf-8"),
            text_to_sign.encode("utf-8"),
            hashlib.sha256,
        ).digest()
        signature = base64.b64encode(signature_digest).decode("utf-8")

        headers["X-Ca-Signature"] = signature
        headers["X-Ca-Signature-Headers"] = signature_headers

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
                "debug_text_to_sign": text_to_sign,
                "debug_signature_headers": signature_headers,
            }
        except Exception as ex:
            return {
                "success": False,
                "message": str(ex),
                "url": url,
            }

    def get_inverters(self, data_token: str) -> dict[str, Any]:
        url = (
            "https://api.sunsynk.net/api/v1/inverters"
            "?page=1"
            "&limit=10"
            "&total=0"
            "&status=-1"
            "&sn="
            "&plantId="
            "&type=-2"
            "&softVer="
            "&hmiVer="
            "&agentCompanyId=-1"
            "&gsn="
        )

        headers = {
            "Accept": "application/json",
            "Authorization": f"Bearer {data_token}",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            "Referer": "https://api.sunsynk.net/device/inverter",
            "Origin": "https://api.sunsynk.net",
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/147.0.0.0 Safari/537.36"
            ),
        }

        try:
            response = requests.get(
                url,
                headers=headers,
                timeout=15,
                verify=self.verify_ssl,
            )

            print("inverters url =", url)
            print("inverters status =", response.status_code)
            print("inverters body =", response.text[:2000])

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
                "status_code": None,
                "url": url,
                "message": str(ex),
            }

    def request_powerview_token(self) -> dict[str, Any]:
        url = "https://pv.inteless.com/oauth/token"

        body = {
            "username": self.username,
            "password": self.password,
            "grant_type": "password",
            "client_id": "csp-web",
        }

        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json;charset=UTF-8",
            "Origin": "https://sunsynk.net",
            "Referer": "https://sunsynk.net/",
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/99.0.4844.74 Safari/537.36"
            ),
        }

        try:
            response = requests.post(
                url,
                headers=headers,
                json=body,
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