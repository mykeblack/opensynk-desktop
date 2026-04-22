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
        self.base_url = base_url.rstrip("/")
        self.access_token = access_token
        self.verify_ssl = verify_ssl
        self.app_key = app_key
        self.app_secret = app_secret
        self.username = username
        self.password = password

        if not self.verify_ssl:
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    def request_access_token(self) -> dict[str, Any]:
        url_path = "/oauth/token"
        url = f"{self.base_url}{url_path}"

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