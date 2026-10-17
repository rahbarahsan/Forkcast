"""Bounded public-source requests with an explicit host and redirect allowlist."""

import json
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener


class SourceError(ValueError):
    pass


def read_public(url, hosts, *, limit=4_000_000, timeout=15):
    def allowed(target):
        parsed = urlsplit(target)
        return (
            parsed.scheme == "https"
            and parsed.hostname in hosts
            and not parsed.username
            and parsed.port in (None, 443)
        )

    class Redirects(HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, headers, newurl):
            if not allowed(newurl):
                raise SourceError("Source redirected outside its allowed hosts")
            return super().redirect_request(req, fp, code, msg, headers, newurl)

    if not allowed(url):
        raise SourceError("Unsupported public source")
    try:
        request = Request(
            url,
            headers={
                "User-Agent": "Forkcast/2.1 (local household recipe and grocery app)",
                "Accept": "application/json,text/html",
            },
        )
        with build_opener(Redirects()).open(request, timeout=timeout) as response:
            body = response.read(limit + 1)
        if len(body) > limit:
            raise SourceError("Source response exceeds the size limit")
        return body.decode("utf-8")
    except (HTTPError, URLError, TimeoutError, UnicodeDecodeError, OSError):
        raise SourceError("Source is unavailable. Try again later or paste its text.") from None


def read_json(url, hosts):
    try:
        return json.loads(read_public(url, hosts))
    except (ValueError, TypeError):
        raise SourceError("Source did not return usable data") from None
